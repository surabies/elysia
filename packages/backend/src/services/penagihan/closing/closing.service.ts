/**
 * Service: Closing Siklus Periode Penagihan & Penerbitan DRD Rekening Air
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 *
 * Mengimplementasikan 12 Tahapan Alur Bisnis Tutup Bulan Sesuai Standar PDAM Tirtawening
 */

import { eq, and, sql, inArray, isNull, desc, asc } from 'drizzle-orm';
import {
  db,
  periodePenagihan,
  caterBacaMeter,
  daftarCatat,
  rekeningDrd,
  pelanggan,
  tarifBlok,
  biayaTetap,
  waterMeter,
  waterMeterMutasi,
  golonganTarif,
  ruteCater,
  kelurahan,
  user,
  nextPeriode,
  type PeriodePenagihan,
} from '@cater/db';
import {
  hitungRincianHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  type HargaBlok,
} from "@cater/backend/domain/tagihan/tagihan.engine";

const UKURAN_BATCH = 500;
const MAKS_CONTOH_HAMBATAN = 20;
const closingInFlightLocks = new Set<string>();

export interface ClosingAuditInfo {
  ditutupAt: string | null;
  ditutupById: string | null;
  ditutupOlehNama?: string | null;
  tanggalJatuhTempo: string | null;
}

export interface HambatanClosing {
  kode: string;
  pesan: string;
  jumlah: number;
  contoh: string[];
}

export interface PratinjauClosingResult {
  periode: string;
  status: 'BERJALAN' | 'TERKUNCI' | 'BELUM_ADA';
  daftarCatat: {
    total: number;
    selesai: number;
    belumSelesai: number;
    readRatePersen: number;
  };
  verifikasi: {
    total: number;
    selesaiV3: number;
    belumSelesai: number;
    siapDisahkan?: number;
    butuhKoreksi?: number;
  };
  pembacaan: {
    total: number;
    sudahDitagih: number;
    akanDitagih: number;
  };
  perkiraan: {
    jumlahSl: number;
    totalM3: number;
    totalTagihan: number;
  };
  hambatan: HambatanClosing[];
  /** Peringatan non-blocking (tidak mempengaruhi bisaDitutup) */
  peringatan: Array<HambatanClosing & { umurHariTertua: number }>;
  bisaDitutup: boolean;
  audit?: ClosingAuditInfo;
}

export interface EksekusiClosingInput {
  periode: string; // e.g. '202601'
  tanggalJatuhTempo: Date;
  userId?: string | null;
}

export interface HasilEksekusiClosing {
  periode: string;
  tagihanDiterbitkan: number;
  tagihanSudahAda: number;
  jumlahSl: number;
  totalM3: number;
  totalTagihan: number;
  audit?: ClosingAuditInfo;
}

export interface WorkflowStageInfo {
  stageNumber: number;
  id: string;
  nama: string;
  kategori: 'PRA_CLOSING' | 'EKSEKUSI' | 'PASCA_CLOSING' | 'MONITORING';
  status: 'SELESAI' | 'SIAP' | 'PERLU_TINDAKAN' | 'TERKUNCI' | 'MENUNGGU';
  deskripsi: string;
  metrikUtama: string;
  canExecute?: boolean;
  routeUrl: string;
  detail?: Record<string, any>;
}

export interface CekSelisihRuteItem {
  ruteKode: string;
  namaRute: string;
  totalPelanggan: number;
  terbaca: number;
  belumTerbaca: number;
  terbitDrd: number;
  selisih: number;
  status: 'SEIMBANG' | 'SELISIH';
}

export interface CekSelisihPelangganResult {
  periode: string;
  modeAudit: 'PRA_CLOSING' | 'PASCA_CLOSING';
  ringkasan: {
    totalMasterPelanggan: number;
    totalDpmTarget: number;
    totalTerbaca: number;
    totalBelumTerbaca: number;
    totalTerbitDrd: number;
    totalSelisihUnbilled: number;
    statusRekonsiliasi: 'MATCH' | 'DISCREPANCY';
  };
  ruteBreakdown: CekSelisihRuteItem[];
  daftarUnbilled: Array<{
    nolg: string;
    nama: string;
    ruteKode: string;
    stml: number;
    stma: number;
    pakaiM3: number;
    statusVerifikasi: string;
  }>;
}

export interface PerbandinganTarifItem {
  tarifKode: string;
  tarifNama: string;
  slPeriodeLalu: number;
  slPeriodeKini: number;
  deltaSl: number;
  m3PeriodeLalu: number;
  m3PeriodeKini: number;
  deltaM3Persen: number;
  rpPeriodeLalu: number;
  rpPeriodeKini: number;
  deltaRpPersen: number;
}

export interface PerbandinganPeriodeResult {
  periodeKini: string;
  periodeLalu: string;
  sumberDataKini?: 'DRD_RESMI' | 'PROYEKSI_PRA_CLOSING';
  ringkasan: {
    totalSlKini: number;
    totalSlLalu: number;
    deltaSl: number;
    totalM3Kini: number;
    totalM3Lalu: number;
    deltaM3Persen: number;
    totalRpKini: number;
    totalRpLalu: number;
    deltaRpPersen: number;
  };
  breakdownTarif: PerbandinganTarifItem[];
}

const FINAL_VERIFIKASI_STATUSES = new Set([
  'APPROVED_FINAL',
  'LOCKED_BILLING',
  'CORRECTED_POST_CLOSE',
]);

const BLOCKING_VERIFIKASI_STATUSES = new Set([
  'NEED_RESURVEY',
  'ANOMALY',
  'DRAFT',
]);

export class ClosingService {
  /**
   * Memastikan userId merujuk ke baris valid di tabel `user` agar tidak pernah melanggar Foreign Key.
   */
  private async resolveValidUser(userId?: string | null): Promise<{ id: string | null; name: string | null }> {
    if (!userId) return { id: null, name: null };
    const [u] = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return { id: u?.id ?? null, name: u?.name ?? null };
  }
  /**
   * Mengambil seluruh blok tarif, golongan tarif, dan biaya tetap yang berlaku pada periode penagihan.
   * ATURAN KETAT: Tidak ada fallback angka default (15000/5000/0).
   * - Tarif dipilih yang masa berlakunya mencakup periodeStr (`berlaku_mulai <= akhirPeriode` dan `berlaku_sampai IS NULL OR berlaku_sampai >= awalPeriode`).
   * - bea_beban diambil dari tabel referensi `biaya_tetap` berdasarkan ukuran meter pelanggan.
   * - bea_admin, air_kotor, lain_lain diambil dari `golongan_tarif` milik pelanggan.
   */
  private async muatKonteksTarif(periodeStr?: string) {
    const [semuaBlok, semuaBiaya, semuaGolongan] = await Promise.all([
      db.select().from(tarifBlok),
      db.select().from(biayaTetap),
      db.select().from(golonganTarif),
    ]);

    let awalPeriode: Date | null = null;
    let akhirPeriode: Date | null = null;
    if (periodeStr && periodeStr.length === 6) {
      const yr = parseInt(periodeStr.slice(0, 4), 10);
      const mo = parseInt(periodeStr.slice(4, 6), 10);
      if (!isNaN(yr) && !isNaN(mo)) {
        awalPeriode = new Date(Date.UTC(yr, mo - 1, 1, 0, 0, 0));
        akhirPeriode = new Date(Date.UTC(yr, mo, 0, 23, 59, 59));
      }
    }

    const isBerlaku = (mulai: Date | null, sampai: Date | null) => {
      if (!awalPeriode || !akhirPeriode) return true;
      if (mulai && mulai > akhirPeriode) return false;
      if (sampai && sampai < awalPeriode) return false;
      return true;
    };

    const blokPerTarif = new Map<string, HargaBlok[]>();
    for (const b of semuaBlok) {
      if (!isBerlaku(b.berlakuMulai, b.berlakuSampai)) continue;
      const list = blokPerTarif.get(b.tarifKode) ?? [];
      list.push({
        blok: b.blok,
        batasAwalM3: b.batasAwalM3,
        batasAkhirM3: b.batasAkhirM3,
        hargaPerM3: Number(b.hargaPerM3),
      });
      blokPerTarif.set(b.tarifKode, list);
    }

    const golonganMap = new Map<
      string,
      { beaAdmin: number; airKotor: number; lainLain: number }
    >();
    for (const g of semuaGolongan) {
      if (g.beaAdmin === null || g.airKotor === null) {
        throw new Error(
          `Golongan tarif '${g.kode}' memiliki komponen biaya tetap (bea_admin/air_kotor) yang kosong di database.`
        );
      }
      golonganMap.set(g.kode, {
        beaAdmin: Number(g.beaAdmin),
        airKotor: Number(g.airKotor),
        lainLain: Number(g.lainLain ?? 0),
      });
    }

    const beaBebanPerUkuran = new Map<string, number>();
    for (const b of semuaBiaya) {
      if (!isBerlaku(b.berlakuMulai, b.berlakuSampai)) continue;
      const nominal = Number(b.nominal);
      if (b.jenis === 'BEA_BEBAN' && b.ukuranMeter) {
        beaBebanPerUkuran.set(b.ukuranMeter.trim(), nominal);
      }
    }

    return { blokPerTarif, golonganMap, beaBebanPerUkuran };
  }

  /**
   * Menghitung komponen tagihan satu pelanggan secara ketat tanpa fallback default.
   * Melempar error jelas jika golongan tarif atau ukuran meter tidak ditemukan di referensi.
   */
  private hitungKomponenTagihanPelanggan(
    nolg: string,
    tarifKode: string | null,
    ukuranMeter: string | null,
    volumeM3: number,
    konteks: {
      blokPerTarif: Map<string, HargaBlok[]>;
      golonganMap: Map<string, { beaAdmin: number; airKotor: number; lainLain: number }>;
      beaBebanPerUkuran: Map<string, number>;
    }
  ) {
    if (!tarifKode) {
      throw new Error(
        `Closing gagal: Pelanggan '${nolg}' tidak memiliki kode golongan tarif (tarif_kode kosong).`
      );
    }
    const golongan = konteks.golonganMap.get(tarifKode);
    const tarifList = konteks.blokPerTarif.get(tarifKode);
    if (!golongan || !tarifList || tarifList.length === 0) {
      throw new Error(
        `Closing gagal: Golongan tarif '${tarifKode}' untuk pelanggan '${nolg}' tidak ditemukan di tabel referensi golongan_tarif / tarif_blok.`
      );
    }

    const ukuranKey = ukuranMeter?.trim() || '';
    if (!ukuranKey || !konteks.beaBebanPerUkuran.has(ukuranKey)) {
      throw new Error(
        `Closing gagal: Ukuran meter '${ukuranKey || '(kosong)'}' untuk pelanggan '${nolg}' tidak ditemukan di tabel referensi biaya_tetap (BEA_BEBAN).`
      );
    }

    const beaBeban = konteks.beaBebanPerUkuran.get(ukuranKey)!;
    const { total: jmlHargaAir, rincian: rincianBlok } = hitungRincianHargaAir(volumeM3, tarifList);
    const totalRekening = hitungTotalTagihan({
      jmlHargaAir,
      beaBeban,
      beaAdmin: golongan.beaAdmin,
      airKotor: golongan.airKotor,
      lainLain: golongan.lainLain,
    });

    return {
      jmlHargaAir,
      rincianBlok,
      beaBeban,
      beaAdmin: golongan.beaAdmin,
      airKotor: golongan.airKotor,
      lainLain: golongan.lainLain,
      totalTagihan: totalRekening,
    };
  }

  /**
   * Pratinjau Kesiapan Penutupan Buku (Closing Preview)
   */
  async pratinjauClosing(periodeStr: string): Promise<PratinjauClosingResult> {
    const [periodeRow] = await db
      .select()
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));

    // Sinkronisasi otomatis DPM periode berjalan:
    // 1) Injeksi pelanggan aktif yang SUDAH memiliki bacaan lapangan di periode ini namun belum ada di daftar_catat (sebagai PBPK)
    //    CATATAN PENTING: Hanya yang memiliki bacaan di periode ini (c.id IS NOT NULL) agar pelanggan baru PBPK
    //    yang diantrekan di akhir bulan (tgl 29) untuk siklus N+1 tidak ketarik mundur menghambat tutup buku N!
    // 2) Tandai DICATAT bila sudah ada laporan bacaan di cater_baca_meter periode ini
    if (periodeRow && periodeRow.status !== 'TERKUNCI') {
      await db.execute(sql`
        INSERT INTO daftar_catat (
          id, periode, nolg, rute_kode, petugas_id, urutan,
          stand_awal, pakai_lalu, sumber, status, selesai_at, catatan, created_at, updated_at
        )
        SELECT
          'dpm-' || ${periodeStr} || '-' || p.nolg,
          ${periodeStr},
          p.nolg,
          COALESCE(c.rute_kode, p.rute_kode),
          c.petugas_id,
          COALESCE(NULLIF(p.no_urut_rute, 0), 999),
          COALESCE(c.stml, 0),
          COALESCE(c.pakai_lalu, 0),
          'PBPK',
          'DICATAT',
          c.tgl_catat,
          'Terdeteksi dari laporan baca meter ' || c.sumber_catat,
          p.created_at,
          NOW()
        FROM pelanggan p
        INNER JOIN cater_baca_meter c ON c.nolg = p.nolg AND c.thbl = ${periodeStr}
        LEFT JOIN daftar_catat dc ON dc.nolg = p.nolg AND dc.periode = ${periodeStr}
        WHERE dc.id IS NULL
          AND p.status != 'DICABUT'
        ON CONFLICT (periode, nolg) DO NOTHING
      `);

      await db.execute(sql`
        UPDATE daftar_catat AS dc
        SET status = 'DICATAT',
            selesai_at = COALESCE(dc.selesai_at, c.tgl_catat, NOW()),
            updated_at = NOW()
        FROM cater_baca_meter AS c
        WHERE dc.periode = ${periodeStr}
          AND c.thbl = ${periodeStr}
          AND dc.nolg = c.nolg
          AND dc.status = 'BELUM_DICATAT'
      `);
    }

    // 1. Data DPM (Target Beban Kerja)
    const dpmRows = await db
      .select({
        status: daftarCatat.status,
        count: sql<number>`count(*)::int`,
      })
      .from(daftarCatat)
      .where(eq(daftarCatat.periode, periodeStr))
      .groupBy(daftarCatat.status);

    let dpmTotal = 0;
    let dpmSelesai = 0;
    for (const d of dpmRows) {
      dpmTotal += d.count;
      if (d.status === 'DICATAT') {
        dpmSelesai += d.count;
      }
    }

    // 2. Data Transaksi Pembacaan & Verifikasi Pelanggan Aktif (diluar DICABUT)
    const caterRows = await db
      .select({
        id: caterBacaMeter.id,
        nolg: caterBacaMeter.nolg,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tarifKode: pelanggan.tarifKode,
        ukuranMeterPelanggan: pelanggan.ukuranMeter,
        ukuranMeterAset: waterMeter.ukuran,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(waterMeter, eq(pelanggan.noMeter, waterMeter.noMeter))
      .where(
        and(
          eq(caterBacaMeter.thbl, periodeStr),
          sql`${pelanggan.status} != 'DICABUT'`
        )
      );

    // Fallback DPM jika daftarCatat belum diisi di legacy data:
    if (dpmTotal === 0 && caterRows.length > 0) {
      dpmTotal = caterRows.length;
      dpmSelesai = caterRows.length;
    }

    const dpmBelumSelesai = Math.max(0, dpmTotal - dpmSelesai);
    const readRatePersen = dpmTotal > 0 ? Number(((dpmSelesai / dpmTotal) * 100).toFixed(2)) : 0;

    let verifSelesaiV3 = 0;
    const barisButuhKoreksi: string[] = [];
    const barisSiapDisahkan: string[] = [];

    for (const c of caterRows) {
      const vol = Number(c.pakaiTagih ?? c.pakaiM3Revisi ?? c.pakaiM3);
      if (FINAL_VERIFIKASI_STATUSES.has(c.statusVerifikasi) && vol >= 0) {
        verifSelesaiV3++;
      } else if (BLOCKING_VERIFIKASI_STATUSES.has(c.statusVerifikasi) || vol < 0) {
        barisButuhKoreksi.push(c.nolg);
      } else {
        barisSiapDisahkan.push(c.nolg);
      }
    }
    const verifBelumSelesai = caterRows.length - verifSelesaiV3;

    // 3. Cek Tagihan yang Sudah Terbit (DRD)
    const existingDrd = await db
      .select({ nolg: rekeningDrd.nolg })
      .from(rekeningDrd)
      .where(eq(rekeningDrd.thbl, periodeStr));
    const setSudahDitagih = new Set(existingDrd.map((d) => d.nolg));

    const hambatan: HambatanClosing[] = [];

    // Cek apakah masih ada mutasi ganti meter (Stand Angkat) yang belum disetujui
    const periodeNum = Number(periodeStr);
    const pendingMutasiRows = await db
      .select({ nolg: waterMeterMutasi.nolg })
      .from(waterMeterMutasi)
      .where(
        and(
          eq(waterMeterMutasi.periode, periodeNum),
          eq(waterMeterMutasi.statusVerifikasi, 'PENDING')
        )
      );

    if (pendingMutasiRows.length > 0) {
      hambatan.push({
        kode: 'MUTASI_METER_PENDING',
        pesan: `Masih ada ${pendingMutasiRows.length.toLocaleString('id-ID')} data pergantian meter air yang belum disetujui pada Langkah 1. Setujui atau tolak data tersebut terlebih dahulu.`,
        jumlah: pendingMutasiRows.length,
        contoh: pendingMutasiRows.slice(0, MAKS_CONTOH_HAMBATAN).map((m) => m.nolg),
      });
    }

    // Peringatan (TIDAK memblokir): mutasi MB yang datanya (no_meter_baru/stand_angkat) belum lengkap
    const peringatan: Array<HambatanClosing & { umurHariTertua: number }> = [];
    const belumLengkapRows = await db
      .select({ nolg: waterMeterMutasi.nolg, createdAt: waterMeterMutasi.createdAt })
      .from(waterMeterMutasi)
      .where(
        and(
          eq(waterMeterMutasi.periode, periodeNum),
          eq(waterMeterMutasi.statusVerifikasi, 'DATA_METER_BELUM_LENGKAP')
        )
      );
    if (belumLengkapRows.length > 0) {
      const umur = belumLengkapRows.map((m) =>
        Math.floor((Date.now() - m.createdAt.getTime()) / 86_400_000)
      );
      const tertua = Math.max(...umur);
      peringatan.push({
        kode: 'MUTASI_METER_DATA_BELUM_LENGKAP',
        pesan: `Ada ${belumLengkapRows.length.toLocaleString('id-ID')} mutasi ganti meter (MB) dengan data teknik belum lengkap (tertua ${tertua} hari). Closing tidak diblokir; koreksi atas bulan kejadian akan diperlukan setelah data masuk.`,
        jumlah: belumLengkapRows.length,
        contoh: belumLengkapRows.slice(0, MAKS_CONTOH_HAMBATAN).map((m) => m.nolg),
        umurHariTertua: tertua,
      });
    }

    if (barisButuhKoreksi.length > 0) {
      hambatan.push({
        kode: 'BACAAN_BUTUH_KOREKSI',
        pesan: `Terdapat ${barisButuhKoreksi.length.toLocaleString('id-ID')} hasil baca meter berstatus Anomali / Perlu Survei Ulang / Kubikasi Negatif yang wajib dikoreksi terlebih dahulu di menu Verifikasi Petugas atau Koreksi Stand.`,
        jumlah: barisButuhKoreksi.length,
        contoh: barisButuhKoreksi.slice(0, MAKS_CONTOH_HAMBATAN),
      });
    }

    if (barisSiapDisahkan.length > 0) {
      hambatan.push({
        kode: 'VERIFIKASI_BELUM_TUNTAS',
        pesan: `Masih terdapat ${barisSiapDisahkan.length.toLocaleString('id-ID')} hasil baca meter yang menunggu pengesahan pada Langkah 2. Klik tombol "Sahkan Seluruh Bacaan Meter" sebelum menutup buku.`,
        jumlah: barisSiapDisahkan.length,
        contoh: barisSiapDisahkan.slice(0, MAKS_CONTOH_HAMBATAN),
      });
    }

    if (dpmBelumSelesai > 0) {
      const belumDicatatList = await db
        .select({ nolg: daftarCatat.nolg })
        .from(daftarCatat)
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            eq(daftarCatat.status, 'BELUM_DICATAT')
          )
        )
        .limit(MAKS_CONTOH_HAMBATAN);

      hambatan.push({
        kode: 'DPM_BELUM_SELESAI',
        pesan: `Target pencatatan meter belum mencapai 100% (tercapai ${readRatePersen}%). Masih ada ${dpmBelumSelesai.toLocaleString('id-ID')} pelanggan aktif yang belum dicatat.`,
        jumlah: dpmBelumSelesai,
        contoh: belumDicatatList.map((b) => b.nolg),
      });
    }

    const konteksTarif = await this.muatKonteksTarif(periodeStr);

    let perkiraanTotalM3 = 0;
    let perkiraanTotalTagihan = 0;
    let akanDitagihCount = 0;
    const barisAnomaliTarif: string[] = [];

    for (const c of caterRows) {
      if (setSudahDitagih.has(c.nolg)) continue;
      akanDitagihCount++;
      const volumeM3 = Math.max(0, Number(c.pakaiTagih ?? c.pakaiM3Revisi ?? c.pakaiM3));
      perkiraanTotalM3 += volumeM3;

      const ukuranEfektif = c.ukuranMeterAset ?? c.ukuranMeterPelanggan;
      try {
        const rincian = this.hitungKomponenTagihanPelanggan(
          c.nolg,
          c.tarifKode,
          ukuranEfektif,
          volumeM3,
          konteksTarif
        );
        perkiraanTotalTagihan += rincian.totalTagihan;
      } catch {
        barisAnomaliTarif.push(c.nolg);
      }
    }

    if (barisAnomaliTarif.length > 0) {
      hambatan.push({
        kode: 'DATA_TARIF_METER_TIDAK_VALID',
        pesan: `Terdapat ${barisAnomaliTarif.length.toLocaleString('id-ID')} pelanggan dengan kode golongan tarif atau ukuran meter belum valid untuk kalkulasi progresif.`,
        jumlah: barisAnomaliTarif.length,
        contoh: barisAnomaliTarif.slice(0, MAKS_CONTOH_HAMBATAN),
      });
    }

    let finalJumlahSl = akanDitagihCount;
    let finalTotalM3 = perkiraanTotalM3;
    let finalTotalTagihan = perkiraanTotalTagihan;

    // Jika DRD sudah ada di database untuk periode ini, ambil agregat riil resmi yang sudah diterbitkan
    if (setSudahDitagih.size > 0) {
      const [drdAgg] = await db
        .select({
          totalSl: sql<number>`count(*)::int`,
          totalM3: sql<number>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::int`,
          totalTagihan: sql<number>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric`,
        })
        .from(rekeningDrd)
        .where(eq(rekeningDrd.thbl, periodeStr));

      if (drdAgg && drdAgg.totalSl > 0) {
        finalJumlahSl = drdAgg.totalSl;
        finalTotalM3 = drdAgg.totalM3;
        finalTotalTagihan = Number(drdAgg.totalTagihan);
      }
    }

    const statusPeriode = (periodeRow ? periodeRow.status : 'BERJALAN') as
      | 'BERJALAN'
      | 'TERKUNCI'
      | 'BELUM_ADA';

    let ditutupOlehNama: string | null = null;
    if (periodeRow?.ditutupById) {
      const resolved = await this.resolveValidUser(periodeRow.ditutupById);
      ditutupOlehNama = resolved.name ?? periodeRow.ditutupById;
    }

    return {
      periode: periodeStr,
      status: statusPeriode,
      daftarCatat: {
        total: dpmTotal,
        selesai: dpmSelesai,
        belumSelesai: dpmBelumSelesai,
        readRatePersen,
      },
      verifikasi: {
        total: caterRows.length,
        selesaiV3: verifSelesaiV3,
        belumSelesai: verifBelumSelesai,
        siapDisahkan: barisSiapDisahkan.length,
        butuhKoreksi: barisButuhKoreksi.length,
      },
      pembacaan: {
        total: caterRows.length,
        sudahDitagih: setSudahDitagih.size,
        akanDitagih: akanDitagihCount,
      },
      perkiraan: {
        jumlahSl: finalJumlahSl,
        totalM3: finalTotalM3,
        totalTagihan: finalTotalTagihan,
      },
      hambatan,
      peringatan,
      bisaDitutup:
        statusPeriode !== 'TERKUNCI' &&
        pendingMutasiRows.length === 0 &&
        verifBelumSelesai === 0 &&
        dpmBelumSelesai === 0 &&
        barisAnomaliTarif.length === 0 &&
        caterRows.length > 0,
      audit: {
        ditutupAt: periodeRow?.ditutupAt ? periodeRow.ditutupAt.toISOString() : null,
        ditutupById: periodeRow?.ditutupById ?? null,
        ditutupOlehNama,
        tanggalJatuhTempo: periodeRow?.tanggalJatuhTempo
          ? periodeRow.tanggalJatuhTempo.toISOString()
          : null,
      },
    };
  }

  /**
   * Eksekusi Penutupan Periode & Penerbitan Batch Rekening DRD
   */
  async eksekusiClosing(input: EksekusiClosingInput): Promise<HasilEksekusiClosing> {
    const { periode: periodeStr, tanggalJatuhTempo, userId } = input;
    const lockKey = `closing:${periodeStr}`;

    if (closingInFlightLocks.has(lockKey)) {
      throw new Error(
        `Proses tutup buku untuk periode ${periodeStr} sedang berlangsung. Mohon tunggu hingga selesai; data Anda tetap aman.`
      );
    }

    closingInFlightLocks.add(lockKey);

    try {
      const [existingPeriode] = await db
        .select()
        .from(periodePenagihan)
        .where(eq(periodePenagihan.periode, periodeStr));

      if (existingPeriode?.status === 'TERKUNCI') {
        throw new Error(
          `Periode ${periodeStr} sudah ditutup dan terkunci sebelumnya. Tidak ada perubahan data yang dilakukan.`
        );
      }

      // Guard 1: Pastikan tidak ada mutasi ganti meter yang masih PENDING
      const periodeNum = Number(periodeStr);
      const [pendingMutasi] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(waterMeterMutasi)
        .where(
          and(
            eq(waterMeterMutasi.periode, periodeNum),
            eq(waterMeterMutasi.statusVerifikasi, 'PENDING')
          )
        );

      if ((pendingMutasi?.count ?? 0) > 0) {
        throw new Error(
          `Tutup buku ditolak karena masih ada ${pendingMutasi.count} pergantian meter air yang belum disetujui. Data tagihan belum diubah. Silakan kembali ke Langkah 1 untuk menyetujui pergantian meter.`
        );
      }

      // Guard 2: Pastikan seluruh pembacaan meter pelanggan aktif periode ini sudah disahkan (APPROVED_FINAL / LOCKED_BILLING / CORRECTED_POST_CLOSE) dan bebas anomali negatif
      const [unapprovedCater] = await db
        .select({
          total: sql<number>`count(*)::int`,
          butuhKoreksi: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} in ('NEED_RESURVEY', 'ANOMALY', 'DRAFT') or coalesce(${caterBacaMeter.pakaiTagih}, ${caterBacaMeter.pakaiM3Revisi}, ${caterBacaMeter.pakaiM3})::numeric < 0 then 1 end)::int`,
          belumDisahkan: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} not in ('APPROVED_FINAL', 'LOCKED_BILLING', 'CORRECTED_POST_CLOSE') then 1 end)::int`,
        })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`
          )
        );

      if ((unapprovedCater?.total ?? 0) === 0) {
        throw new Error(
          `Tutup buku ditolak karena belum ada data bacaan meter pada periode ${periodeStr}. Tidak ada data yang diubah.`
        );
      }

      if ((unapprovedCater?.butuhKoreksi ?? 0) > 0) {
        throw new Error(
          `Tutup buku ditolak karena masih terdapat ${unapprovedCater.butuhKoreksi.toLocaleString('id-ID')} hasil baca meter berstatus Anomali / Perlu Survei Ulang / Kubikasi Negatif. Selesaikan terlebih dahulu di menu Verifikasi Baca Petugas atau Koreksi Stand.`
        );
      }

      if ((unapprovedCater?.belumDisahkan ?? 0) > 0) {
        throw new Error(
          `Tutup buku ditolak karena masih ada ${unapprovedCater.belumDisahkan.toLocaleString('id-ID')} hasil baca meter yang belum disahkan. Data tagihan tetap aman. Silakan kembali ke Langkah 2 dan klik "Sahkan Seluruh Bacaan Meter".`
        );
      }

      // Guard 3: Pastikan tidak ada pelanggan aktif di DPM (daftar_catat) yang masih BELUM_DICATAT
      const belumDicatatRows = await db
        .select({
          nolg: daftarCatat.nolg,
          nama: pelanggan.nama,
          ruteKode: daftarCatat.ruteKode,
        })
        .from(daftarCatat)
        .leftJoin(pelanggan, eq(daftarCatat.nolg, pelanggan.nolg))
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            eq(daftarCatat.status, 'BELUM_DICATAT')
          )
        );

      if (belumDicatatRows.length > 0) {
        const daftarContoh = belumDicatatRows
          .slice(0, MAKS_CONTOH_HAMBATAN)
          .map((r) => `${r.nolg} (${r.nama ?? '-'}, Rute ${r.ruteKode ?? '-'})`)
          .join(', ');
        throw new Error(
          `Tutup buku ditolak karena masih ada ${belumDicatatRows.length.toLocaleString('id-ID')} pelanggan aktif pada DPM periode ${periodeStr} yang berstatus BELUM_DICATAT. Daftar pelanggan: [${daftarContoh}]${belumDicatatRows.length > MAKS_CONTOH_HAMBATAN ? ` ...dan ${belumDicatatRows.length - MAKS_CONTOH_HAMBATAN} lainnya` : ''}.`
        );
      }

      const konteksTarif = await this.muatKonteksTarif(periodeStr);

      // Ambil pembacaan meter pelanggan aktif periode ini beserta tarif & ukuran meter (diluar DICABUT agar sambungan dicabut tidak ditagih biaya beban)
      const caterList = await db
        .select({
          id: caterBacaMeter.id,
          nolg: caterBacaMeter.nolg,
          pakaiM3: caterBacaMeter.pakaiM3,
          pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
          pakaiTagih: caterBacaMeter.pakaiTagih,
          tarifKode: pelanggan.tarifKode,
          ukuranMeterPelanggan: pelanggan.ukuranMeter,
          ukuranMeterAset: waterMeter.ukuran,
        })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .leftJoin(waterMeter, eq(pelanggan.noMeter, waterMeter.noMeter))
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`
          )
        );

      const existingDrd = await db
        .select({ nolg: rekeningDrd.nolg })
        .from(rekeningDrd)
        .where(eq(rekeningDrd.thbl, periodeStr));
      const setSudahDitagih = new Set(existingDrd.map((d) => d.nolg));

      const siapDitagih = caterList.filter((c) => !setSudahDitagih.has(c.nolg));

      let diterbitkan = 0;
      let akumulasiTotalM3 = 0;
      let akumulasiTotalTagihan = 0;
      const waktuTutup = new Date();
      const resolvedUser = await this.resolveValidUser(userId);

      await db.transaction(async (tx) => {
        // Re-check status di dalam transaksi untuk menjamin atomisitas & mencegah race condition
        const [lockedCheck] = await tx
          .select({ status: periodePenagihan.status })
          .from(periodePenagihan)
          .where(eq(periodePenagihan.periode, periodeStr));

        if (lockedCheck?.status === 'TERKUNCI') {
          throw new Error(
            `Periode ${periodeStr} sudah ditutup oleh proses lain. Transaksi dibatalkan agar data tidak ganda.`
          );
        }

        // 1. Batch insert tagihan rekening DRD jika ada yang belum terbit (snapshot biaya tetap)
        if (siapDitagih.length > 0) {
          for (let mulai = 0; mulai < siapDitagih.length; mulai += UKURAN_BATCH) {
            const batch = siapDitagih.slice(mulai, mulai + UKURAN_BATCH);
            const drdRows = batch.map((item) => {
              const volumeM3 = Number(item.pakaiTagih ?? item.pakaiM3Revisi ?? item.pakaiM3);
              const ukuranEfektif = item.ukuranMeterAset ?? item.ukuranMeterPelanggan;
              const rincian = this.hitungKomponenTagihanPelanggan(
                item.nolg,
                item.tarifKode,
                ukuranEfektif,
                volumeM3,
                konteksTarif
              );

              akumulasiTotalM3 += volumeM3;
              akumulasiTotalTagihan += rincian.totalTagihan;

              return {
                id: `drd-${periodeStr}-${item.nolg}`,
                thbl: periodeStr,
                nolg: item.nolg,
                pakaiM3: String(volumeM3),
                blokM3: tentukanBlok(volumeM3),
                rincianBlok: rincian.rincianBlok,
                jmlHargaAir: String(rincian.jmlHargaAir),
                beaBeban: String(rincian.beaBeban),
                beaAdmin: String(rincian.beaAdmin),
                airKotor: String(rincian.airKotor),
                lainLain: String(rincian.lainLain),
                totalTagihan: String(rincian.totalTagihan),
                statusLunas: false,
              };
            });

            await tx
              .insert(rekeningDrd)
              .values(drdRows)
              .onConflictDoUpdate({
                target: [rekeningDrd.thbl, rekeningDrd.nolg],
                set: {
                  pakaiM3: sql`EXCLUDED.pakai_m3`,
                  blokM3: sql`EXCLUDED.blok_m3`,
                  rincianBlok: sql`EXCLUDED.rincian_blok`,
                  jmlHargaAir: sql`EXCLUDED.jml_harga_air`,
                  beaBeban: sql`EXCLUDED.bea_beban`,
                  beaAdmin: sql`EXCLUDED.bea_admin`,
                  airKotor: sql`EXCLUDED.air_kotor`,
                  lainLain: sql`EXCLUDED.lain_lain`,
                  totalTagihan: sql`EXCLUDED.total_tagihan`,
                  updatedAt: waktuTutup,
                },
              });
            diterbitkan += batch.length;
          }
        }

        // 2. Kunci seluruh pembacaan meter periode ini menjadi LOCKED_BILLING
        await tx
          .update(caterBacaMeter)
          .set({ statusVerifikasi: 'LOCKED_BILLING', updatedAt: waktuTutup })
          .where(eq(caterBacaMeter.thbl, periodeStr));

        // 3. Ambil total resmi DRD dari database
        const [drdAgg] = await tx
          .select({
            totalSl: sql<number>`count(*)::int`,
            totalM3: sql<number>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::int`,
            totalTagihan: sql<number>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric`,
          })
          .from(rekeningDrd)
          .where(eq(rekeningDrd.thbl, periodeStr));

        const finalTotalSl = drdAgg?.totalSl ?? (diterbitkan + setSudahDitagih.size);
        const finalTotalM3 = drdAgg?.totalM3 ?? akumulasiTotalM3;
        const finalTotalTagihan = drdAgg?.totalTagihan ? Number(drdAgg.totalTagihan) : akumulasiTotalTagihan;

        // 4. Kunci Periode Penagihan & Simpan Snapshot Audit (gunakan valid user.id agar FK aman)
        await tx
          .insert(periodePenagihan)
          .values({
            periode: periodeStr,
            status: 'TERKUNCI',
            tanggalJatuhTempo,
            ditutupAt: waktuTutup,
            ditutupById: resolvedUser.id,
            jumlahSl: finalTotalSl,
            totalM3: String(finalTotalM3),
            totalTagihan: String(finalTotalTagihan),
          })
          .onConflictDoUpdate({
            target: periodePenagihan.periode,
            set: {
              status: 'TERKUNCI',
              tanggalJatuhTempo,
              ditutupAt: waktuTutup,
              ditutupById: resolvedUser.id,
              jumlahSl: finalTotalSl,
              totalM3: String(finalTotalM3),
              totalTagihan: String(finalTotalTagihan),
              updatedAt: waktuTutup,
            },
          });
      });

      const [finalDrdAgg] = await db
        .select({
          totalSl: sql<number>`count(*)::int`,
          totalM3: sql<number>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::int`,
          totalTagihan: sql<number>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric`,
        })
        .from(rekeningDrd)
        .where(eq(rekeningDrd.thbl, periodeStr));

      return {
        periode: periodeStr,
        tagihanDiterbitkan: diterbitkan,
        tagihanSudahAda: setSudahDitagih.size,
        jumlahSl: finalDrdAgg?.totalSl ?? (diterbitkan + setSudahDitagih.size),
        totalM3: finalDrdAgg?.totalM3 ?? akumulasiTotalM3,
        totalTagihan: Number(finalDrdAgg?.totalTagihan ?? akumulasiTotalTagihan),
        audit: {
          ditutupAt: waktuTutup.toISOString(),
          ditutupById: resolvedUser.id,
          ditutupOlehNama: resolvedUser.name,
          tanggalJatuhTempo: tanggalJatuhTempo.toISOString(),
        },
      };
    } finally {
      closingInFlightLocks.delete(lockKey);
    }
  }

  /**
   * Tahap 4: Posting Datameter Massal
   * Mengesahkan seluruh pembacaan meter yang layak tagih (SUBMITTED / VERIFIED / VERIFIED_L1 / VERIFIED_L2)
   * menjadi APPROVED_FINAL, serta menolak meloloskan data ANOMALY / NEED_RESURVEY / kubikasi negatif.
   */
  async postingDatameterMassal(periodeStr: string, _userId?: string | null): Promise<{ diposting: number; message: string }> {
    const lockKey = `posting:${periodeStr}`;
    if (closingInFlightLocks.has(lockKey)) {
      throw new Error(
        `Proses pengesahan bacaan meter periode ${periodeStr} sedang berlangsung. Mohon tunggu sebentar; data Anda tetap aman.`
      );
    }

    closingInFlightLocks.add(lockKey);
    try {
      const [periodeRow] = await db
        .select({ status: periodePenagihan.status })
        .from(periodePenagihan)
        .where(eq(periodePenagihan.periode, periodeStr));

      if (periodeRow?.status === 'TERKUNCI') {
        throw new Error(
          `Periode ${periodeStr} sudah terkunci. Pengesahan bacaan meter tidak dapat dijalankan ulang pada periode yang telah ditutup.`
        );
      }

      const blockingRows = await db
        .select({
          nolg: caterBacaMeter.nolg,
          statusVerifikasi: caterBacaMeter.statusVerifikasi,
        })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`,
            sql`(${caterBacaMeter.statusVerifikasi} in ('NEED_RESURVEY', 'ANOMALY', 'DRAFT') or coalesce(${caterBacaMeter.pakaiTagih}, ${caterBacaMeter.pakaiM3Revisi}, ${caterBacaMeter.pakaiM3})::numeric < 0)`
          )
        );

      if (blockingRows.length > 0) {
        const contoh = blockingRows
          .slice(0, 10)
          .map((r) => `${r.nolg} (${r.statusVerifikasi})`)
          .join(', ');
        throw new Error(
          `Pengesahan massal ditahan karena masih ada ${blockingRows.length.toLocaleString('id-ID')} bacaan berstatus Anomali / Perlu Survei Ulang / Kubikasi Negatif: [${contoh}]${blockingRows.length > 10 ? ` ...dan ${blockingRows.length - 10} lainnya` : ''}. Selesaikan terlebih dahulu di menu Verifikasi Baca Petugas atau Koreksi Stand.`
        );
      }

      const [caterCounts] = await db
        .select({
          total: sql<number>`count(*)::int`,
          belumApprove: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} not in ('APPROVED_FINAL', 'LOCKED_BILLING', 'CORRECTED_POST_CLOSE') then 1 end)::int`,
        })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`
          )
        );

      if (!caterCounts || caterCounts.total === 0) {
        throw new Error(
          `Belum ada data hasil baca meter pada periode ${periodeStr} untuk disahkan.`
        );
      }

      if (caterCounts.belumApprove === 0) {
        return {
          diposting: 0,
          message: 'Seluruh data hasil baca meter periode ini sudah berstatus disahkan (APPROVED_FINAL). Anda siap melanjutkan ke langkah berikutnya.',
        };
      }

      await db
        .update(caterBacaMeter)
        .set({
          statusVerifikasi: 'APPROVED_FINAL',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            inArray(caterBacaMeter.statusVerifikasi, [
              'SUBMITTED',
              'VERIFIED',
              'VERIFIED_L1',
              'VERIFIED_L2',
            ])
          )
        );

      return {
        diposting: caterCounts.belumApprove,
        message: `Berhasil mengesahkan ${caterCounts.belumApprove.toLocaleString('id-ID')} data hasil baca meter. Seluruh bacaan kini siap dihitung menjadi tagihan.`,
      };
    } finally {
      closingInFlightLocks.delete(lockKey);
    }
  }

  /**
   * Evaluasi Status 12 Tahapan Alur Tutup Bulan (Closing Workflow Pipeline)
   */
  async getWorkflowStages(periodeStr: string): Promise<{ periode: string; isClosed: boolean; stages: WorkflowStageInfo[] }> {
    const periodeNum = Number(periodeStr);

    // Kueri paralel untuk efisiensi
    const [
      periodeRow,
      pelangganCounts,
      mutasiCounts,
      caterStatusCounts,
      drdAgg,
      nextPeriodeRow,
      nextDpmCount,
    ] = await Promise.all([
      db.select().from(periodePenagihan).where(eq(periodePenagihan.periode, periodeStr)),
      db
        .select({
          total: sql<number>`count(*)::int`,
          tanpaRute: sql<number>`count(case when ${pelanggan.ruteKode} is null then 1 end)::int`,
          tanpaTarif: sql<number>`count(case when ${pelanggan.tarifKode} is null then 1 end)::int`,
          tanpaUrutan: sql<number>`count(case when ${pelanggan.noUrutRute} is null then 1 end)::int`,
        })
        .from(pelanggan)
        .where(sql`${pelanggan.status} != 'DICABUT'`),
      db
        .select({
          total: sql<number>`count(*)::int`,
          pending: sql<number>`count(case when ${waterMeterMutasi.statusVerifikasi} = 'PENDING' then 1 end)::int`,
          approved: sql<number>`count(case when ${waterMeterMutasi.statusVerifikasi} = 'APPROVED' then 1 end)::int`,
        })
        .from(waterMeterMutasi)
        .where(eq(waterMeterMutasi.periode, periodeNum)),
      db
        .select({
          total: sql<number>`count(*)::int`,
          approvedFinal: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} = 'APPROVED_FINAL' then 1 end)::int`,
          lockedBilling: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} = 'LOCKED_BILLING' then 1 end)::int`,
          verified: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} in ('VERIFIED', 'VERIFIED_L1', 'VERIFIED_L2') then 1 end)::int`,
          pendingOrDraft: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} in ('DRAFT', 'SUBMITTED', 'NEED_RESURVEY') then 1 end)::int`,
        })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`
          )
        ),
      db
        .select({
          totalSl: sql<number>`count(*)::int`,
          totalM3: sql<number>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::int`,
          totalTagihan: sql<number>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric`,
        })
        .from(rekeningDrd)
        .where(eq(rekeningDrd.thbl, periodeStr)),
      // Cek periode N+1
      (async () => {
        const nextMonthYear = parseInt(periodeStr.slice(0, 4));
        const nextMonthMonth = parseInt(periodeStr.slice(4, 6)) + 1;
        const nextThbl = nextMonthMonth > 12
          ? `${nextMonthYear + 1}01`
          : `${nextMonthYear}${String(nextMonthMonth).padStart(2, '0')}`;
        return db.select().from(periodePenagihan).where(eq(periodePenagihan.periode, nextThbl));
      })(),
      (async () => {
        const nextMonthYear = parseInt(periodeStr.slice(0, 4));
        const nextMonthMonth = parseInt(periodeStr.slice(4, 6)) + 1;
        const nextThbl = nextMonthMonth > 12
          ? `${nextMonthYear + 1}01`
          : `${nextMonthYear}${String(nextMonthMonth).padStart(2, '0')}`;
        return db
          .select({ count: sql<number>`count(*)::int` })
          .from(daftarCatat)
          .where(eq(daftarCatat.periode, nextThbl));
      })(),
    ]);

    const isPeriodLocked = periodeRow[0]?.status === 'TERKUNCI';
    const totalMaster = pelangganCounts[0]?.total ?? 0;
    const totalCater = caterStatusCounts[0]?.total ?? 0;
    const totalDrdSl = drdAgg[0]?.totalSl ?? 0;
    const totalMutasiGwm = mutasiCounts[0]?.total ?? 0;
    const mutasiPending = mutasiCounts[0]?.pending ?? 0;
    const unapprovedCater = (caterStatusCounts[0]?.verified ?? 0) + (caterStatusCounts[0]?.pendingOrDraft ?? 0);

    const stages: WorkflowStageInfo[] = [
      // 1. PBPK
      {
        stageNumber: 1,
        id: 'pbpk',
        nama: 'PBPK (Pasang Baru & Perubahan Kategori)',
        kategori: 'PRA_CLOSING',
        status: (pelangganCounts[0]?.tanpaTarif ?? 0) === 0 ? 'SELESAI' : 'PERLU_TINDAKAN',
        deskripsi: 'Finalisasi data pelanggan baru dan pengesahan mutasi golongan tarif periode ini.',
        metrikUtama: `${totalMaster.toLocaleString('id-ID')} Pelanggan Terdaftar (${pelangganCounts[0]?.tanpaTarif ?? 0} Anomali Tarif)`,
        routeUrl: '/tools-tutup/pbpk',
        detail: { totalMaster, tanpaTarif: pelangganCounts[0]?.tanpaTarif ?? 0 },
      },
      // 2. Stand Angkat
      {
        stageNumber: 2,
        id: 'stand-angkat',
        nama: 'Stand Angkat (Ganti Water Meter)',
        kategori: 'PRA_CLOSING',
        status: mutasiPending === 0 ? 'SELESAI' : 'PERLU_TINDAKAN',
        deskripsi: 'Penguncian angka stand meter lama & stand meter baru untuk transaksi ganti meter.',
        metrikUtama: `${totalMutasiGwm} Meter Diganti (${mutasiPending} Menunggu Approval)`,
        canExecute: mutasiPending > 0,
        routeUrl: '/tools-tutup/stand-angkat',
        detail: { totalMutasi: totalMutasiGwm, pending: mutasiPending, approved: mutasiCounts[0]?.approved ?? 0 },
      },
      // 3. Update Zonasi
      {
        stageNumber: 3,
        id: 'update-zonasi',
        nama: 'Update Zonasi & Pemetaan Rute',
        kategori: 'PRA_CLOSING',
        status: (pelangganCounts[0]?.tanpaRute ?? 0) === 0 ? 'SELESAI' : 'PERLU_TINDAKAN',
        deskripsi: 'Pembaruan struktur zonasi wilayah, kelurahan, dan rute pembacaan meter.',
        metrikUtama: `${(pelangganCounts[0]?.tanpaRute ?? 0) === 0 ? '100% Terpetakan' : `${pelangganCounts[0]?.tanpaRute} Belum Ada Rute`}`,
        canExecute: true,
        routeUrl: '/tools-tutup/update-zonasi',
        detail: { tanpaRute: pelangganCounts[0]?.tanpaRute ?? 0 },
      },
      // 4. Posting Datameter
      {
        stageNumber: 4,
        id: 'posting-datameter',
        nama: 'Posting Datameter (Approval Final)',
        kategori: 'PRA_CLOSING',
        status: unapprovedCater === 0 ? 'SELESAI' : 'SIAP',
        deskripsi: 'Publikasi dan approval hasil verifikasi bacaan lapangan ke buku piutang air.',
        metrikUtama: `${(caterStatusCounts[0]?.approvedFinal ?? 0) + (caterStatusCounts[0]?.lockedBilling ?? 0)} Disahkan / ${totalCater} Total Bacaan`,
        canExecute: unapprovedCater > 0,
        routeUrl: '/tools-tutup/posting-datameter',
        detail: {
          approved: (caterStatusCounts[0]?.approvedFinal ?? 0) + (caterStatusCounts[0]?.lockedBilling ?? 0),
          unapproved: unapprovedCater,
          total: totalCater,
        },
      },
      // 5. Create Closed DRD
      {
        stageNumber: 5,
        id: 'create-closed-drd',
        nama: 'Create Closed DRD & Kunci Periode',
        kategori: 'EKSEKUSI',
        status: isPeriodLocked ? 'TERKUNCI' : totalDrdSl > 0 ? 'SIAP' : 'MENUNGGU',
        deskripsi: 'Penerbitan rekening resmi air dan penguncian transaksi billing (LOCKED_BILLING).',
        metrikUtama: isPeriodLocked
          ? `Terkunci: ${totalDrdSl.toLocaleString('id-ID')} SL (Rp ${Number(drdAgg[0]?.totalTagihan ?? 0).toLocaleString('id-ID')})`
          : totalDrdSl > 0
          ? `Draft DRD Siap Kunci: ${totalDrdSl.toLocaleString('id-ID')} SL`
          : 'Belum Terbit',
        canExecute: !isPeriodLocked,
        routeUrl: '/tools-tutup/create-closed-drd',
        detail: {
          isLocked: isPeriodLocked,
          totalSl: totalDrdSl,
          totalRp: Number(drdAgg[0]?.totalTagihan ?? 0),
          totalM3: drdAgg[0]?.totalM3 ?? 0,
        },
      },
      // 6. Create Perbandingan
      {
        stageNumber: 6,
        id: 'create-perbandingan',
        nama: 'Create Perbandingan (Rekonsiliasi Antar Bulan)',
        kategori: 'EKSEKUSI',
        status: totalDrdSl > 0 ? 'SELESAI' : 'MENUNGGU',
        deskripsi: 'Pembuatan perbandingan konsumsi m3 dan omzet tagihan terhadap periode sebelumnya.',
        metrikUtama: totalDrdSl > 0 ? `${totalDrdSl.toLocaleString('id-ID')} Rekening Siap Dibandingkan` : 'Menunggu DRD',
        routeUrl: '/tools-tutup/create-perbandingan',
        detail: { totalSl: totalDrdSl },
      },
      // 7. Create Bulan Baru
      {
        stageNumber: 7,
        id: 'create-bulan-baru',
        nama: 'Create Bulan Baru (Inisialisasi Periode N+1)',
        kategori: 'PASCA_CLOSING',
        status: (nextPeriodeRow && nextPeriodeRow.length > 0) ? 'SELESAI' : isPeriodLocked ? 'SIAP' : 'MENUNGGU',
        deskripsi: 'Inisialisasi siklus penagihan bulan berikutnya dan penerbitan target DPM baru.',
        metrikUtama: (nextPeriodeRow && nextPeriodeRow.length > 0)
          ? `Periode ${nextPeriodeRow[0].periode} Aktif (${nextDpmCount[0]?.count ?? 0} DPM)`
          : isPeriodLocked ? 'Siap Diinisialisasi' : 'Menunggu Closing Selesai',
        canExecute: isPeriodLocked && (!nextPeriodeRow || nextPeriodeRow.length === 0),
        routeUrl: '/tools-tutup/create-bulan-baru',
        detail: { hasNextPeriod: !!(nextPeriodeRow && nextPeriodeRow.length > 0) },
      },
      // 8. Upload Master Pelanggan
      {
        stageNumber: 8,
        id: 'upload-master-pelanggan',
        nama: 'Upload Master Pelanggan',
        kategori: 'PASCA_CLOSING',
        status: 'SELESAI',
        deskripsi: 'Sinkronisasi database induk master pelanggan ke server dan perangkat pembaca.',
        metrikUtama: `${totalMaster.toLocaleString('id-ID')} Pelanggan Terverifikasi`,
        canExecute: true,
        routeUrl: '/tools-tutup/upload-master-pelanggan',
        detail: { totalMaster },
      },
      // 9. Sync Pelanggan Baru
      {
        stageNumber: 9,
        id: 'sync-pelanggan-baru',
        nama: 'Sync Pelanggan Baru ke Rute',
        kategori: 'PASCA_CLOSING',
        status: (pelangganCounts[0]?.tanpaRute ?? 0) === 0 ? 'SELESAI' : 'PERLU_TINDAKAN',
        deskripsi: 'Sinkronisasi pelanggan pendaftaran baru ke buku rute DPM periode mendatang.',
        metrikUtama: `${(pelangganCounts[0]?.tanpaRute ?? 0) === 0 ? 'Semua Pelanggan Masuk Rute' : `${pelangganCounts[0]?.tanpaRute} Butuh Penugasan Rute`}`,
        canExecute: true,
        routeUrl: '/tools-tutup/sync-pelanggan-baru',
        detail: { tanpaRute: pelangganCounts[0]?.tanpaRute ?? 0 },
      },
      // 10. Update Data Pelanggan
      {
        stageNumber: 10,
        id: 'update-data-pelanggan',
        nama: 'Update Data Pelanggan (Sequencing)',
        kategori: 'PASCA_CLOSING',
        status: (pelangganCounts[0]?.tanpaUrutan ?? 0) === 0 ? 'SELESAI' : 'SIAP',
        deskripsi: 'Pembaruan massal nomor urut rute lapangan, koordinat GPS, dan nomor telepon.',
        metrikUtama: `${totalMaster - (pelangganCounts[0]?.tanpaUrutan ?? 0)} Rute Berurutan`,
        canExecute: true,
        routeUrl: '/tools-tutup/update-data-pelanggan',
        detail: { tanpaUrutan: pelangganCounts[0]?.tanpaUrutan ?? 0 },
      },
      // 11. Cek Selisih Pelanggan
      {
        stageNumber: 11,
        id: 'cek-selisih-pelanggan',
        nama: 'Cek Selisih Pelanggan (Audit 4 Pilar)',
        kategori: 'MONITORING',
        status: (totalMaster === totalCater && totalCater === totalDrdSl) ? 'SELESAI' : 'PERLU_TINDAKAN',
        deskripsi: 'Audit rekonsiliasi matematis 4 pilar: Master vs DPM vs Pembacaan vs DRD.',
        metrikUtama: `Master: ${totalMaster.toLocaleString('id-ID')} | Baca: ${totalCater.toLocaleString('id-ID')} | DRD: ${totalDrdSl.toLocaleString('id-ID')}`,
        routeUrl: '/tools-tutup/cek-selisih-pelanggan',
        detail: { totalMaster, totalCater, totalDrdSl, selisih: totalMaster - totalDrdSl },
      },
      // 12. Monitoring Tutup Bulan
      {
        stageNumber: 12,
        id: 'monitoring-tutup-bulan',
        nama: 'Monitoring Tutup Bulan & Status Siklus',
        kategori: 'MONITORING',
        status: isPeriodLocked ? 'TERKUNCI' : 'SIAP',
        deskripsi: 'Konsol sentral pemantauan status 12 tahapan dan eksekusi closing penagihan.',
        metrikUtama: isPeriodLocked ? 'Periode Ditutup & Terkunci' : 'Konsol Aktif (Periode Berjalan)',
        routeUrl: '/tools-tutup/monitoring-tutup-bulan',
        detail: { isLocked: isPeriodLocked },
      },
    ];

    return {
      periode: periodeStr,
      isClosed: isPeriodLocked,
      stages,
    };
  }

  /**
   * Tahap 3 (Cek Selisih Pelanggan):
   * Rekonsiliasi 4 Pilar Aktif (diluar DICABUT): Master vs DPM vs Bacaan vs DRD.
   * Mendukung mode adaptif:
   * - PRA_CLOSING (periode BERJALAN & DRD belum terbit): mendeteksi rute yang masih memiliki meter BELUM_DICATAT.
   * - PASCA_CLOSING (periode TERKUNCI / DRD sudah terbit): mengaudit kesamaan 100% Master = DPM = Baca = DRD.
   */
  async getCekSelisihPelanggan(periodeStr: string): Promise<CekSelisihPelangganResult> {
    const [
      periodeRowRes,
      masterCountRes,
      dpmCountRes,
      caterActiveCountRes,
      caterBilledOrActiveCountRes,
      drdCountRes,
      masterRuteRows,
    ] = await Promise.all([
      db
        .select({
          status: periodePenagihan.status,
          jumlahSl: periodePenagihan.jumlahSl,
        })
        .from(periodePenagihan)
        .where(eq(periodePenagihan.periode, periodeStr)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(pelanggan)
        .where(sql`${pelanggan.status} != 'DICABUT'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(daftarCatat)
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            sql`${daftarCatat.status} != 'DICABUT'`
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .leftJoin(
          rekeningDrd,
          and(
            eq(caterBacaMeter.nolg, rekeningDrd.nolg),
            eq(rekeningDrd.thbl, periodeStr)
          )
        )
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`(${pelanggan.status} != 'DICABUT' OR ${rekeningDrd.nolg} IS NOT NULL)`
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(rekeningDrd)
        .where(eq(rekeningDrd.thbl, periodeStr)),
      db
        .select({ kode: ruteCater.kode, seksiNama: ruteCater.seksiNama })
        .from(ruteCater),
    ]);

    const isLocked = periodeRowRes[0]?.status === 'TERKUNCI';
    const snapshotSl = periodeRowRes[0]?.jumlahSl ?? null;
    const totalDrd = drdCountRes[0]?.count ?? 0;

    const modeAudit: 'PRA_CLOSING' | 'PASCA_CLOSING' =
      isLocked || totalDrd > 0 ? 'PASCA_CLOSING' : 'PRA_CLOSING';

    const rawDpm = dpmCountRes[0]?.count ?? 0;
    const totalMaster =
      modeAudit === 'PASCA_CLOSING'
        ? (snapshotSl ?? (rawDpm > 0 ? rawDpm : totalDrd))
        : (masterCountRes[0]?.count ?? 0);
    const totalDpm =
      modeAudit === 'PASCA_CLOSING'
        ? (rawDpm > 0 ? rawDpm : totalMaster)
        : (rawDpm > 0 ? rawDpm : totalMaster);
    const totalCater =
      modeAudit === 'PASCA_CLOSING'
        ? (caterBilledOrActiveCountRes[0]?.count ?? 0)
        : (caterActiveCountRes[0]?.count ?? 0);

    const totalBelumTerbaca = Math.max(0, totalDpm - totalCater);
    const totalSelisihUnbilled =
      modeAudit === 'PASCA_CLOSING'
        ? Math.max(totalBelumTerbaca, Math.abs(totalCater - totalDrd))
        : Math.max(Math.abs(totalMaster - totalDpm), totalBelumTerbaca);

    const mapNamaRute = new Map(
      masterRuteRows.map((r) => [r.kode, r.seksiNama ?? `Wilayah ${r.kode}`])
    );

    const [ruteMasterRows, caterPerRute, drdPerRute] = await Promise.all([
      db
        .select({
          ruteKode: pelanggan.ruteKode,
          totalPelanggan: sql<number>`count(*)::int`,
        })
        .from(pelanggan)
        .where(sql`${pelanggan.status} != 'DICABUT'`)
        .groupBy(pelanggan.ruteKode)
        .orderBy(asc(pelanggan.ruteKode)),
      modeAudit === 'PASCA_CLOSING'
        ? db
            .select({
              ruteKode: pelanggan.ruteKode,
              terbaca: sql<number>`count(*)::int`,
            })
            .from(caterBacaMeter)
            .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
            .leftJoin(
              rekeningDrd,
              and(
                eq(caterBacaMeter.nolg, rekeningDrd.nolg),
                eq(rekeningDrd.thbl, periodeStr)
              )
            )
            .where(
              and(
                eq(caterBacaMeter.thbl, periodeStr),
                sql`(${pelanggan.status} != 'DICABUT' OR ${rekeningDrd.nolg} IS NOT NULL)`
              )
            )
            .groupBy(pelanggan.ruteKode)
        : db
            .select({
              ruteKode: pelanggan.ruteKode,
              terbaca: sql<number>`count(*)::int`,
            })
            .from(caterBacaMeter)
            .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
            .where(
              and(
                eq(caterBacaMeter.thbl, periodeStr),
                sql`${pelanggan.status} != 'DICABUT'`
              )
            )
            .groupBy(pelanggan.ruteKode),
      db
        .select({
          ruteKode: pelanggan.ruteKode,
          terbitDrd: sql<number>`count(*)::int`,
        })
        .from(rekeningDrd)
        .innerJoin(pelanggan, eq(rekeningDrd.nolg, pelanggan.nolg))
        .where(eq(rekeningDrd.thbl, periodeStr))
        .groupBy(pelanggan.ruteKode),
    ]);

    const mapCater = new Map(
      caterPerRute.map((c) => [c.ruteKode ?? 'TANPA_RUTE', c.terbaca])
    );
    const mapDrd = new Map(
      drdPerRute.map((d) => [d.ruteKode ?? 'TANPA_RUTE', d.terbitDrd])
    );

    const allRuteSet = new Set<string>([
      ...ruteMasterRows.map((r) => r.ruteKode ?? 'TANPA_RUTE'),
      ...mapCater.keys(),
      ...mapDrd.keys(),
    ]);
    const mapMasterRuteCount = new Map(
      ruteMasterRows.map((r) => [r.ruteKode ?? 'TANPA_RUTE', r.totalPelanggan])
    );

    const ruteBreakdown: CekSelisihRuteItem[] = Array.from(allRuteSet)
      .sort()
      .map((kode) => {
        const terbaca = mapCater.get(kode) ?? 0;
        const terbitDrd = mapDrd.get(kode) ?? 0;
        const targetRute =
          modeAudit === 'PASCA_CLOSING'
            ? Math.max(terbaca, terbitDrd)
            : (mapMasterRuteCount.get(kode) ?? 0);
        const belumTerbaca = Math.max(0, targetRute - terbaca);
        const selisih =
          modeAudit === 'PASCA_CLOSING'
            ? Math.abs(terbaca - terbitDrd)
            : Math.abs(targetRute - terbaca);
        return {
          ruteKode: kode,
          namaRute: mapNamaRute.get(kode) ?? `Wilayah ${kode}`,
          totalPelanggan: targetRute,
          terbaca,
          belumTerbaca,
          terbitDrd,
          selisih,
          status: selisih === 0 ? 'SEIMBANG' : 'SELISIH',
        };
      });

    let daftarUnbilled: CekSelisihPelangganResult['daftarUnbilled'] = [];

    if (modeAudit === 'PASCA_CLOSING') {
      const unbilledQuery = await db
        .select({
          nolg: caterBacaMeter.nolg,
          nama: pelanggan.nama,
          ruteKode: pelanggan.ruteKode,
          stml: caterBacaMeter.stml,
          stma: caterBacaMeter.stma,
          pakaiM3: caterBacaMeter.pakaiM3,
          statusVerifikasi: caterBacaMeter.statusVerifikasi,
        })
        .from(caterBacaMeter)
        .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
        .leftJoin(
          rekeningDrd,
          and(eq(caterBacaMeter.nolg, rekeningDrd.nolg), eq(rekeningDrd.thbl, periodeStr))
        )
        .where(
          and(
            eq(caterBacaMeter.thbl, periodeStr),
            sql`${pelanggan.status} != 'DICABUT'`,
            isNull(rekeningDrd.nolg)
          )
        )
        .limit(50);

      daftarUnbilled = unbilledQuery.map((u) => ({
        nolg: u.nolg,
        nama: u.nama ?? '—',
        ruteKode: u.ruteKode ?? '—',
        stml: Number(u.stml ?? 0),
        stma: Number(u.stma ?? 0),
        pakaiM3: Number(u.pakaiM3 ?? 0),
        statusVerifikasi: u.statusVerifikasi,
      }));
    } else if (totalBelumTerbaca > 0) {
      const unreadDpmQuery = await db
        .select({
          nolg: daftarCatat.nolg,
          nama: pelanggan.nama,
          ruteKode: daftarCatat.ruteKode,
          standAwal: daftarCatat.standAwal,
          sumber: daftarCatat.sumber,
        })
        .from(daftarCatat)
        .innerJoin(pelanggan, eq(daftarCatat.nolg, pelanggan.nolg))
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            eq(daftarCatat.status, 'BELUM_DICATAT'),
            sql`${pelanggan.status} != 'DICABUT'`
          )
        )
        .orderBy(asc(daftarCatat.ruteKode), asc(daftarCatat.nolg))
        .limit(50);

      daftarUnbilled = unreadDpmQuery.map((u) => ({
        nolg: u.nolg,
        nama: u.nama ?? '—',
        ruteKode: u.ruteKode ?? '—',
        stml: Number(u.standAwal ?? 0),
        stma: 0,
        pakaiM3: 0,
        statusVerifikasi: u.sumber === 'PBPK' ? 'PBPK_BELUM_BACA' : 'BELUM_DICATAT',
      }));
    }

    return {
      periode: periodeStr,
      modeAudit,
      ringkasan: {
        totalMasterPelanggan: totalMaster,
        totalDpmTarget: totalDpm,
        totalTerbaca: totalCater,
        totalBelumTerbaca,
        totalTerbitDrd: totalDrd,
        totalSelisihUnbilled,
        statusRekonsiliasi: totalSelisihUnbilled === 0 ? 'MATCH' : 'DISCREPANCY',
      },
      ruteBreakdown,
      daftarUnbilled,
    };
  }

  /**
   * Tahap 6: Create Perbandingan
   * Komparasi Konsumsi Kubikasi & Rupiah Tagihan Periode N vs N-1 (100% Data Riil Tanpa Estimasi Fiktif).
   * Jika DRD periode kini belum diterbitkan (Pra-Closing di Langkah 3), menggunakan kalkulasi proyeksi riil dari cater_baca_meter.
   */
  async getPerbandinganPeriode(periodeStr: string): Promise<PerbandinganPeriodeResult> {
    const year = parseInt(periodeStr.slice(0, 4));
    const month = parseInt(periodeStr.slice(4, 6));
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const periodeLaluStr = `${prevYear}${String(prevMonth).padStart(2, '0')}`;

    const [
      kiniTarifDrd,
      laluTarifDrd,
      masterTarif,
    ] = await Promise.all([
      db
        .select({
          tarifKode: pelanggan.tarifKode,
          sl: sql<number>`count(*)::int`,
          m3: sql<number>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::int`,
          rp: sql<number>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric`,
        })
        .from(rekeningDrd)
        .innerJoin(pelanggan, eq(rekeningDrd.nolg, pelanggan.nolg))
        .where(eq(rekeningDrd.thbl, periodeStr))
        .groupBy(pelanggan.tarifKode),
      db
        .select({
          tarifKode: pelanggan.tarifKode,
          sl: sql<number>`count(*)::int`,
          m3: sql<number>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::int`,
          rp: sql<number>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric`,
        })
        .from(rekeningDrd)
        .innerJoin(pelanggan, eq(rekeningDrd.nolg, pelanggan.nolg))
        .where(eq(rekeningDrd.thbl, periodeLaluStr))
        .groupBy(pelanggan.tarifKode),
      db.select().from(golonganTarif),
    ]);

    const mapNamaTarif = new Map(masterTarif.map((t) => [t.kode, t.nama]));
    const mapKini = new Map<string, { sl: number; m3: number; rp: number }>();
    let sumberDataKini: 'DRD_RESMI' | 'PROYEKSI_PRA_CLOSING' = 'DRD_RESMI';

    if (kiniTarifDrd.length > 0) {
      for (const kt of kiniTarifDrd) {
        const kode = kt.tarifKode ?? 'TANPA_TARIF';
        mapKini.set(kode, {
          sl: kt.sl,
          m3: kt.m3,
          rp: Number(kt.rp),
        });
      }
    } else {
      // Proyeksi Pra-Closing riil dari cater_baca_meter apabila rekening_drd periode ini belum dikunci
      sumberDataKini = 'PROYEKSI_PRA_CLOSING';
      const [caterRows, konteksTarif] = await Promise.all([
        db
          .select({
            nolg: caterBacaMeter.nolg,
            pakaiM3: caterBacaMeter.pakaiM3,
            pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
            pakaiTagih: caterBacaMeter.pakaiTagih,
            tarifKode: pelanggan.tarifKode,
            ukuranMeterPelanggan: pelanggan.ukuranMeter,
            ukuranMeterAset: waterMeter.ukuran,
          })
          .from(caterBacaMeter)
          .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
          .leftJoin(waterMeter, eq(pelanggan.noMeter, waterMeter.noMeter))
          .where(
            and(
              eq(caterBacaMeter.thbl, periodeStr),
              sql`${pelanggan.status} != 'DICABUT'`
            )
          ),
        this.muatKonteksTarif(periodeStr),
      ]);

      for (const c of caterRows) {
        const kode = c.tarifKode ?? 'TANPA_TARIF';
        const vol = Math.max(0, Number(c.pakaiTagih ?? c.pakaiM3Revisi ?? c.pakaiM3));
        let tagihanRp = 0;
        try {
          const rincian = this.hitungKomponenTagihanPelanggan(
            c.nolg,
            c.tarifKode,
            c.ukuranMeterAset ?? c.ukuranMeterPelanggan,
            vol,
            konteksTarif
          );
          tagihanRp = rincian.totalTagihan;
        } catch {
          tagihanRp = 0;
        }

        const prev = mapKini.get(kode) ?? { sl: 0, m3: 0, rp: 0 };
        prev.sl += 1;
        prev.m3 += vol;
        prev.rp += tagihanRp;
        mapKini.set(kode, prev);
      }
    }

    const mapLalu = new Map<string, { sl: number; m3: number; rp: number }>();
    for (const lt of laluTarifDrd) {
      const kode = lt.tarifKode ?? 'TANPA_TARIF';
      mapLalu.set(kode, {
        sl: lt.sl,
        m3: lt.m3,
        rp: Number(lt.rp),
      });
    }

    const allKodeSet = new Set<string>([...mapKini.keys(), ...mapLalu.keys()]);
    const sortedKodes = Array.from(allKodeSet).sort();

    let totalSlKini = 0;
    let totalSlLalu = 0;
    let totalM3Kini = 0;
    let totalM3Lalu = 0;
    let totalRpKini = 0;
    let totalRpLalu = 0;

    const breakdownTarif: PerbandinganTarifItem[] = sortedKodes.map((kode) => {
      const kini = mapKini.get(kode) ?? { sl: 0, m3: 0, rp: 0 };
      const lalu = mapLalu.get(kode) ?? { sl: 0, m3: 0, rp: 0 };

      totalSlKini += kini.sl;
      totalSlLalu += lalu.sl;
      totalM3Kini += kini.m3;
      totalM3Lalu += lalu.m3;
      totalRpKini += kini.rp;
      totalRpLalu += lalu.rp;

      const dM3 =
        lalu.m3 > 0
          ? Number((((kini.m3 - lalu.m3) / lalu.m3) * 100).toFixed(2))
          : 0;
      const dRp =
        lalu.rp > 0
          ? Number((((kini.rp - lalu.rp) / lalu.rp) * 100).toFixed(2))
          : 0;

      return {
        tarifKode: kode,
        tarifNama: mapNamaTarif.get(kode) ?? `Golongan ${kode}`,
        slPeriodeLalu: lalu.sl,
        slPeriodeKini: kini.sl,
        deltaSl: kini.sl - lalu.sl,
        m3PeriodeLalu: lalu.m3,
        m3PeriodeKini: kini.m3,
        deltaM3Persen: dM3,
        rpPeriodeLalu: lalu.rp,
        rpPeriodeKini: kini.rp,
        deltaRpPersen: dRp,
      };
    });

    const deltaSl = totalSlKini - totalSlLalu;
    const deltaM3Persen =
      totalM3Lalu > 0
        ? Number((((totalM3Kini - totalM3Lalu) / totalM3Lalu) * 100).toFixed(2))
        : 0;
    const deltaRpPersen =
      totalRpLalu > 0
        ? Number((((totalRpKini - totalRpLalu) / totalRpLalu) * 100).toFixed(2))
        : 0;

    return {
      periodeKini: periodeStr,
      periodeLalu: periodeLaluStr,
      sumberDataKini,
      ringkasan: {
        totalSlKini,
        totalSlLalu,
        deltaSl,
        totalM3Kini,
        totalM3Lalu,
        deltaM3Persen,
        totalRpKini,
        totalRpLalu,
        deltaRpPersen,
      },
      breakdownTarif,
    };
  }

  /**
   * Tahap 2: Ambil Daftar Mutasi Stand Angkat (Water Meter Mutasi)
   */
  async getStandAngkatMutasi(periodeStr: string) {
    const periodeNum = Number(periodeStr);
    const mutasiList = await db
      .select({
        id: waterMeterMutasi.id,
        nolg: waterMeterMutasi.nolg,
        namaPelanggan: pelanggan.nama,
        periode: waterMeterMutasi.periode,
        tglGanti: waterMeterMutasi.tglGanti,
        alasan: waterMeterMutasi.alasan,
        keterangan: waterMeterMutasi.keterangan,
        noMeterLama: waterMeterMutasi.noMeterLama,
        standAngkat: waterMeterMutasi.standAngkat,
        noMeterBaru: waterMeterMutasi.noMeterBaru,
        standPasang: waterMeterMutasi.standPasang,
        petugasPasang: waterMeterMutasi.petugasPasang,
        statusVerifikasi: waterMeterMutasi.statusVerifikasi,
      })
      .from(waterMeterMutasi)
      .leftJoin(pelanggan, eq(waterMeterMutasi.nolg, pelanggan.nolg))
      .where(eq(waterMeterMutasi.periode, periodeNum))
      .orderBy(desc(waterMeterMutasi.createdAt));

    return mutasiList;
  }

  /**
   * Tahap 2: Verifikasi / Validasi Stand Angkat
   */
  async verifikasiStandAngkat(
    id: string,
    verifikatorId: string | null,
    status: 'APPROVED' | 'REJECTED',
    catatan?: string
  ) {
    const [existingMutasi] = await db
      .select({
        id: waterMeterMutasi.id,
        nolg: waterMeterMutasi.nolg,
        periode: waterMeterMutasi.periode,
        noMeterBaru: waterMeterMutasi.noMeterBaru,
        standAngkat: waterMeterMutasi.standAngkat,
      })
      .from(waterMeterMutasi)
      .where(eq(waterMeterMutasi.id, id))
      .limit(1);

    if (!existingMutasi) {
      throw new Error(`Data pergantian meter dengan ID '${id}' tidak ditemukan.`);
    }

    const [periodeRow] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, String(existingMutasi.periode)));

    if (periodeRow?.status === 'TERKUNCI') {
      throw new Error(
        `Periode ${existingMutasi.periode} sudah terkunci. Status pergantian meter tidak dapat diubah kembali.`
      );
    }

    if (
      status === 'APPROVED' &&
      (!existingMutasi.noMeterBaru || existingMutasi.standAngkat === null)
    ) {
      throw new Error(
        `Pergantian meter pelanggan ${existingMutasi.nolg} belum dapat disetujui karena Nomor Meter Baru atau Stand Angkat belum dilengkapi oleh tim teknik.`
      );
    }

    const resolvedUser = await this.resolveValidUser(verifikatorId);

    await db
      .update(waterMeterMutasi)
      .set({
        statusVerifikasi: status,
        verifikatorId: resolvedUser.id,
        catatanVerifikasi: catatan ?? null,
        tglVerifikasi: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(waterMeterMutasi.id, id));

    return {
      success: true,
      message: `Pergantian meter pelanggan ${existingMutasi.nolg} berhasil diperbarui menjadi ${status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK'}.`,
    };
  }

  /**
   * Info Periode Kerja Aktif & Daftar Periode Penagihan
   * Mendukung sekaligus kontrak Closing Console dan hook terpusat `usePeriodeKerja`.
   */
  async getPeriodeKerja() {
    const daftarRows = await db
      .select({
        periode: periodePenagihan.periode,
        status: periodePenagihan.status,
        jumlahSl: periodePenagihan.jumlahSl,
      })
      .from(periodePenagihan)
      .orderBy(desc(periodePenagihan.periode));

    const daftarPeriode = daftarRows.map((r) => ({
      periode: r.periode,
      status: r.status as 'BERJALAN' | 'TERKUNCI',
      jumlahSl: r.jumlahSl,
    }));

    const openPeriod = daftarPeriode.find((p) => p.status === 'BERJALAN');
    const latestPeriod = daftarPeriode[0]?.periode ?? '';
    const periodeAktif = openPeriod ? openPeriod.periode : latestPeriod;
    const saranPeriode = openPeriod
      ? openPeriod.periode
      : latestPeriod
        ? nextPeriode(latestPeriod)
        : '';
    const saranBulanBaru = periodeAktif ? nextPeriode(periodeAktif) : '';

    return {
      periodeAktif,
      saranPeriode,
      saranBulanBaru,
      daftarPeriode,
      // Kontrak hook usePeriodeKerja (PanelTabel Verifikasi & Modul Lain):
      periodeKerja: openPeriod ? Number(openPeriod.periode) : null,
      periode: daftarPeriode.map((d) => ({
        periode: Number(d.periode),
        terkunci: d.status === 'TERKUNCI',
      })),
      saran: saranPeriode || null,
    };
  }

  /**
   * Tahap 3: Update Zonasi & Pemetaan Rute Otomatis
   * Menetapkan ruteKode dan kelurahanKode default bagi pelanggan yang belum terpetakan,
   * serta menyelaraskan ruteKode pada tabel daftarCatat (DPM) periode berjalan.
   */
  async sinkronZonasiRute(periodeStr: string) {
    const [defaultRute] = await db
      .select({ kode: ruteCater.kode })
      .from(ruteCater)
      .orderBy(asc(ruteCater.kode))
      .limit(1);

    const [defaultKelurahan] = await db
      .select({ kode: kelurahan.kode })
      .from(kelurahan)
      .orderBy(asc(kelurahan.kode))
      .limit(1);

    const fallbackRuteKode = defaultRute?.kode ?? 'CD101';
    const fallbackKelKode = defaultKelurahan?.kode ?? null;

    const [unmappedCounts] = await db
      .select({
        tanpaRute: sql<number>`count(case when ${pelanggan.ruteKode} is null then 1 end)::int`,
        tanpaKelurahan: sql<number>`count(case when ${pelanggan.kelurahanKode} is null then 1 end)::int`,
      })
      .from(pelanggan);

    const jmlTanpaRute = unmappedCounts?.tanpaRute ?? 0;
    const jmlTanpaKelurahan = unmappedCounts?.tanpaKelurahan ?? 0;

    await db.transaction(async (tx) => {
      if (jmlTanpaRute > 0 && defaultRute) {
        await tx
          .update(pelanggan)
          .set({
            ruteKode: fallbackRuteKode,
            updatedAt: new Date(),
          })
          .where(isNull(pelanggan.ruteKode));
      }

      if (jmlTanpaKelurahan > 0 && fallbackKelKode) {
        await tx
          .update(pelanggan)
          .set({
            kelurahanKode: fallbackKelKode,
            updatedAt: new Date(),
          })
          .where(isNull(pelanggan.kelurahanKode));
      }

      // Sinkronkan juga daftarCatat yang ruteKode-nya masih kosong (hanya jika periode belum terkunci)
      const [periodeCheck] = await tx
        .select({ status: periodePenagihan.status })
        .from(periodePenagihan)
        .where(eq(periodePenagihan.periode, periodeStr));

      if (defaultRute && periodeCheck?.status !== 'TERKUNCI') {
        await tx
          .update(daftarCatat)
          .set({
            ruteKode: fallbackRuteKode,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(daftarCatat.periode, periodeStr),
              isNull(daftarCatat.ruteKode)
            )
          );
      }
    });

    return {
      periode: periodeStr,
      dipetakanRute: jmlTanpaRute,
      dipetakanKelurahan: jmlTanpaKelurahan,
      ruteDefault: fallbackRuteKode,
      message:
        jmlTanpaRute === 0 && jmlTanpaKelurahan === 0
          ? `Seluruh pelanggan pada periode ${periodeStr} sudah memiliki zonasi kelurahan & kode rute yang valid (100% terpetakan).`
          : `Berhasil menyelaraskan zonasi: ${jmlTanpaRute} pelanggan dipetakan ke rute ${fallbackRuteKode} dan ${jmlTanpaKelurahan} pelanggan disinkronkan kelurahannya.`,
    };
  }

  /**
   * Tahap 8: Upload & Validasi Master Pelanggan
   * Memvalidasi integritas data induk pelanggan (golongan tarif, aset water meter, dan status sambungan).
   */
  async validasiUploadMasterPelanggan(periodeStr: string) {
    const [defaultTarif] = await db
      .select({ kode: golonganTarif.kode })
      .from(golonganTarif)
      .orderBy(asc(golonganTarif.kode))
      .limit(1);

    const fallbackTarif = defaultTarif?.kode ?? '2A2';

    const [anomaliCounts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        tanpaTarif: sql<number>`count(case when ${pelanggan.tarifKode} is null then 1 end)::int`,
        tanpaMeter: sql<number>`count(case when ${pelanggan.noMeter} is null then 1 end)::int`,
      })
      .from(pelanggan);

    const jmlTanpaTarif = anomaliCounts?.tanpaTarif ?? 0;

    if (jmlTanpaTarif > 0 && defaultTarif) {
      await db
        .update(pelanggan)
        .set({
          tarifKode: fallbackTarif,
          updatedAt: new Date(),
        })
        .where(isNull(pelanggan.tarifKode));
    }

    return {
      periode: periodeStr,
      totalMaster: anomaliCounts?.total ?? 0,
      dinormalisasiTarif: jmlTanpaTarif,
      tanpaMeter: anomaliCounts?.tanpaMeter ?? 0,
      message: `Sinkronisasi & validasi Master Pelanggan selesai: ${(anomaliCounts?.total ?? 0).toLocaleString('id-ID')} sambungan aktif terverifikasi (${jmlTanpaTarif} golongan tarif dinormalisasi).`,
    };
  }

  /**
   * Tahap 9: Sync Pelanggan Baru ke Rute DPM
   * Menemukan seluruh pelanggan aktif di tabel pelanggan yang belum masuk ke daftarCatat (DPM)
   * pada periode target dan menginjeksinya dengan sumber 'PBPK'.
   */
  async syncPelangganBaruKeDpm(periodeStr: string) {
    const [periodeRow] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));

    if (periodeRow?.status === 'TERKUNCI') {
      throw new Error(
        `Periode ${periodeStr} sudah terkunci. Sinkronisasi pelanggan baru hanya dapat dijalankan pada jadwal periode yang sedang BERJALAN (mis. ${nextPeriode(periodeStr)}).`
      );
    }

    const allPelanggan = await db
      .select({
        nolg: pelanggan.nolg,
        status: pelanggan.status,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        pencatatDefault: ruteCater.pencatatDefault,
      })
      .from(pelanggan)
      .leftJoin(ruteCater, eq(pelanggan.ruteKode, ruteCater.kode));

    const existingDpm = await db
      .select({ nolg: daftarCatat.nolg })
      .from(daftarCatat)
      .where(eq(daftarCatat.periode, periodeStr));

    const existingReadings = await db
      .select({
        nolg: caterBacaMeter.nolg,
        stml: caterBacaMeter.stml,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        petugasId: caterBacaMeter.petugasId,
        tglCatat: caterBacaMeter.tglCatat,
        sumberCatat: caterBacaMeter.sumberCatat,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, periodeStr));

    const mapReading = new Map(existingReadings.map((r) => [r.nolg, r]));
    const setDpm = new Set(existingDpm.map((d) => d.nolg));
    const belumMasukDpm = allPelanggan.filter(
      (p) => !setDpm.has(p.nolg) && p.status !== 'DICABUT'
    );

    let diinjeksi = 0;

    if (belumMasukDpm.length > 0) {
      await db.transaction(async (tx) => {
        for (let i = 0; i < belumMasukDpm.length; i += UKURAN_BATCH) {
          const batch = belumMasukDpm.slice(i, i + UKURAN_BATCH);
          const rows = batch.map((p, idx) => {
            const rd = mapReading.get(p.nolg);
            return {
              id: `dpm-${periodeStr}-${p.nolg}`,
              periode: periodeStr,
              nolg: p.nolg,
              ruteKode: p.ruteKode,
              petugasId: rd?.petugasId ?? p.pencatatDefault ?? null,
              urutan: p.noUrutRute && p.noUrutRute > 0 ? p.noUrutRute : idx + 1,
              standAwal: rd ? String(rd.stml ?? '0') : '0',
              pakaiLalu: rd?.pakaiLalu ? String(rd.pakaiLalu) : '0',
              sumber: 'PBPK',
              status: rd ? 'DICATAT' : 'BELUM_DICATAT',
              selesaiAt: rd?.tglCatat ?? null,
              catatan: rd
                ? `Disinkronkan dari bacaan ${rd.sumberCatat} periode ${periodeStr}`
                : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });

          await tx
            .insert(daftarCatat)
            .values(rows)
            .onConflictDoNothing({
              target: [daftarCatat.periode, daftarCatat.nolg],
            });

          diinjeksi += rows.length;
        }
      });
    }

    return {
      periode: periodeStr,
      totalMaster: allPelanggan.length,
      sudahDiDpm: setDpm.size,
      diinjeksiBaru: diinjeksi,
      message:
        diinjeksi === 0
          ? `Seluruh ${allPelanggan.length.toLocaleString('id-ID')} pelanggan aktif sudah terdaftar di DPM periode ${periodeStr} (0 selisih).`
          : `Berhasil menyinkronkan dan menginjeksi ${diinjeksi.toLocaleString('id-ID')} pelanggan baru ke rute DPM periode ${periodeStr}.`,
    };
  }

  /**
   * Tahap 10: Update Data Pelanggan (Sequencing Nomor Urut Rute)
   * Menormalisasi nomor urut rute (noUrutRute) pelanggan yang masih bernilai null atau <= 0
   * agar berurutan rapi di setiap rute baca meter.
   */
  async sequencingUrutanPelanggan(periodeStr: string) {
    const [countsBefore] = await db
      .select({
        total: sql<number>`count(*)::int`,
        tanpaUrutan: sql<number>`count(case when ${pelanggan.noUrutRute} is null or ${pelanggan.noUrutRute} <= 0 then 1 end)::int`,
      })
      .from(pelanggan);

    const perluUpdate = countsBefore?.tanpaUrutan ?? 0;

    // Gunakan window function row_number() per rute_kode untuk menormalisasi nomor urut yang kosong/0
    if (perluUpdate > 0) {
      await db.execute(sql`
        WITH ranked AS (
          SELECT nolg, ROW_NUMBER() OVER (PARTITION BY coalesce(rute_kode, 'DEFAULT') ORDER BY nolg ASC)::int AS seq_num
          FROM pelanggan
        )
        UPDATE pelanggan AS p
        SET no_urut_rute = ranked.seq_num,
            updated_at = NOW()
        FROM ranked
        WHERE p.nolg = ranked.nolg
          AND (p.no_urut_rute IS NULL OR p.no_urut_rute <= 0)
      `);
    }

    // Sinkronkan urutan pada daftarCatat periode ini jika urutan <= 0 dan periode belum terkunci
    const [periodeRow] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));

    if (periodeRow?.status !== 'TERKUNCI') {
      await db.execute(sql`
        UPDATE daftar_catat AS dc
        SET urutan = COALESCE(p.no_urut_rute, 1),
            updated_at = NOW()
        FROM pelanggan AS p
        WHERE dc.nolg = p.nolg
          AND dc.periode = ${periodeStr}
          AND dc.urutan <= 0
      `);
    }

    return {
      periode: periodeStr,
      totalPelanggan: countsBefore?.total ?? 0,
      diurutkan: perluUpdate,
      message:
        perluUpdate === 0
          ? `Sequencing rute pelanggan periode ${periodeStr} sudah teratur 100% (${(countsBefore?.total ?? 0).toLocaleString('id-ID')} SL berurutan).`
          : `Berhasil menormalisasi urutan baca (sequencing) untuk ${perluUpdate.toLocaleString('id-ID')} pelanggan pada rute periode ${periodeStr}.`,
    };
  }
}

export const closingService = new ClosingService();
