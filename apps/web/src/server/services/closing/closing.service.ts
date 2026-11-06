/**
 * Service: Closing Siklus Periode Penagihan & Penerbitan DRD Rekening Air
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 */

import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  db,
  periodePenagihan,
  caterBacaMeter,
  daftarCatat,
  rekeningDrd,
  pelanggan,
  tarifBlok,
  biayaTetap,
  type PeriodePenagihan,
} from '@cater/db';
import {
  hitungRincianHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  type HargaBlok,
} from '../../domain/tagihan/tagihan.engine';

const UKURAN_BATCH = 500;
const MAKS_CONTOH_HAMBATAN = 20;

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
  bisaDitutup: boolean;
}

export interface EksekusiClosingInput {
  periode: string; // e.g. '202601'
  tanggalJatuhTempo: Date;
  userId: string;
}

export interface HasilEksekusiClosing {
  periode: string;
  tagihanDiterbitkan: number;
  tagihanSudahAda: number;
  jumlahSl: number;
  totalM3: number;
  totalTagihan: number;
}

export class ClosingService {
  /**
   * Mengambil seluruh blok tarif dan biaya tetap aktif untuk periode penagihan
   */
  private async muatKonteksTarif() {
    const semuaBlok = await db.select().from(tarifBlok);
    const semuaBiaya = await db.select().from(biayaTetap);

    const blokPerTarif = new Map<string, HargaBlok[]>();
    for (const b of semuaBlok) {
      const list = blokPerTarif.get(b.tarifKode) ?? [];
      list.push({
        blok: b.blok,
        batasAwalM3: b.batasAwalM3,
        batasAkhirM3: b.batasAkhirM3,
        hargaPerM3: Number(b.hargaPerM3),
      });
      blokPerTarif.set(b.tarifKode, list);
    }

    const beaBebanPerUkuran = new Map<string, number>();
    let beaAdminDefault = 5000;
    let airKotorDefault = 0;

    for (const b of semuaBiaya) {
      const nominal = Number(b.nominal);
      if (b.jenis === 'BEA_BEBAN' && b.ukuranMeter) {
        beaBebanPerUkuran.set(b.ukuranMeter, nominal);
      } else if (b.jenis === 'BEA_ADMIN') {
        beaAdminDefault = nominal;
      } else if (b.jenis === 'AIR_KOTOR') {
        airKotorDefault = nominal;
      }
    }

    return { blokPerTarif, beaBebanPerUkuran, beaAdminDefault, airKotorDefault };
  }

  /**
   * Pratinjau Kesiapan Penutupan Buku (Closing Preview)
   * Mengevaluasi kelayakan closing tanpa menulis ke database
   */
  async pratinjauClosing(periodeStr: string): Promise<PratinjauClosingResult> {
    const [periodeRow] = await db
      .select()
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));

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
    const dpmBelumSelesai = dpmTotal - dpmSelesai;
    const readRatePersen = dpmTotal > 0 ? Number(((dpmSelesai / dpmTotal) * 100).toFixed(2)) : 0;

    // 2. Data Transaksi Pembacaan & Verifikasi
    const caterRows = await db
      .select({
        id: caterBacaMeter.id,
        nolg: caterBacaMeter.nolg,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, periodeStr));

    let verifSelesaiV3 = 0;
    for (const c of caterRows) {
      if (c.statusVerifikasi === 'APPROVED_FINAL' || c.statusVerifikasi === 'LOCKED_BILLING') {
        verifSelesaiV3++;
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

    if (verifBelumSelesai > 0) {
      hambatan.push({
        kode: 'VERIFIKASI_BELUM_TUNTAS',
        pesan: `Masih terdapat ${verifBelumSelesai} pembacaan meter yang belum disahkan V3 (Senior Manager/Direksi).`,
        jumlah: verifBelumSelesai,
        contoh: caterRows
          .filter((c) => c.statusVerifikasi !== 'APPROVED_FINAL' && c.statusVerifikasi !== 'LOCKED_BILLING')
          .slice(0, MAKS_CONTOH_HAMBATAN)
          .map((c) => c.nolg),
      });
    }

    if (dpmBelumSelesai > 0) {
      hambatan.push({
        kode: 'DPM_BELUM_SELESAI',
        pesan: `Read rate belum 100% (${readRatePersen}% tercapai). Tersisa ${dpmBelumSelesai} pelanggan pada DPM yang belum tercatat.`,
        jumlah: dpmBelumSelesai,
        contoh: [],
      });
    }

    const { blokPerTarif, beaBebanPerUkuran, beaAdminDefault, airKotorDefault } =
      await this.muatKonteksTarif();

    let perkiraanTotalM3 = 0;
    let perkiraanTotalTagihan = 0;
    let akanDitagihCount = 0;

    for (const c of caterRows) {
      if (setSudahDitagih.has(c.nolg)) continue;
      akanDitagihCount++;
      const volumeM3 = Number(c.pakaiTagih ?? c.pakaiM3);
      perkiraanTotalM3 += volumeM3;

      const tarifList = blokPerTarif.get('2A2') ?? []; // Default fallback jika belum mapping
      const { total: jmlHargaAir } = hitungRincianHargaAir(volumeM3, tarifList);
      const beaBeban = beaBebanPerUkuran.get('1/2') ?? 15000;
      const totalRekening = hitungTotalTagihan({
        jmlHargaAir,
        beaBeban,
        beaAdmin: beaAdminDefault,
        airKotor: airKotorDefault,
      });
      perkiraanTotalTagihan += totalRekening;
    }

    const statusPeriode = (periodeRow ? periodeRow.status : 'BELUM_ADA') as
      | 'BERJALAN'
      | 'TERKUNCI'
      | 'BELUM_ADA';

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
      },
      pembacaan: {
        total: caterRows.length,
        sudahDitagih: setSudahDitagih.size,
        akanDitagih: akanDitagihCount,
      },
      perkiraan: {
        jumlahSl: akanDitagihCount,
        totalM3: perkiraanTotalM3,
        totalTagihan: perkiraanTotalTagihan,
      },
      hambatan,
      bisaDitutup: statusPeriode !== 'TERKUNCI',
    };
  }

  /**
   * Eksekusi Penutupan Periode & Penerbitan Batch Rekening DRD
   * Menerapkan transaksi atomic Drizzle (db.transaction)
   */
  async eksekusiClosing(input: EksekusiClosingInput): Promise<HasilEksekusiClosing> {
    const { periode: periodeStr, tanggalJatuhTempo, userId } = input;

    const [existingPeriode] = await db
      .select()
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));

    if (existingPeriode?.status === 'TERKUNCI') {
      throw new Error(`Periode ${periodeStr} sudah ditutup dan terkunci. Buka kunci terlebih dahulu bila perlu penyesuaian.`);
    }

    const { blokPerTarif, beaBebanPerUkuran, beaAdminDefault, airKotorDefault } =
      await this.muatKonteksTarif();

    // Ambil pembacaan meter periode ini yang belum memiliki tagihan DRD
    const caterList = await db
      .select({
        id: caterBacaMeter.id,
        nolg: caterBacaMeter.nolg,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        tarifKode: pelanggan.tarifKode,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(eq(caterBacaMeter.thbl, periodeStr));

    const existingDrd = await db
      .select({ nolg: rekeningDrd.nolg })
      .from(rekeningDrd)
      .where(eq(rekeningDrd.thbl, periodeStr));
    const setSudahDitagih = new Set(existingDrd.map((d) => d.nolg));

    const siapDitagih = caterList.filter((c) => !setSudahDitagih.has(c.nolg));

    let diterbitkan = 0;
    let akumulasiTotalM3 = 0;
    let akumulasiTotalTagihan = 0;

    await db.transaction(async (tx) => {
      // 1. Batch insert tagihan rekening DRD
      for (let mulai = 0; mulai < siapDitagih.length; mulai += UKURAN_BATCH) {
        const batch = siapDitagih.slice(mulai, mulai + UKURAN_BATCH);
        const drdRows = batch.map((item) => {
          const volumeM3 = Number(item.pakaiTagih ?? item.pakaiM3);
          const tarifList = blokPerTarif.get(item.tarifKode ?? '2A2') ?? [];
          const { total: jmlHargaAir } = hitungRincianHargaAir(volumeM3, tarifList);
          const beaBeban = beaBebanPerUkuran.get('1/2') ?? 15000;
          const totalTagihan = hitungTotalTagihan({
            jmlHargaAir,
            beaBeban,
            beaAdmin: beaAdminDefault,
            airKotor: airKotorDefault,
          });

          akumulasiTotalM3 += volumeM3;
          akumulasiTotalTagihan += totalTagihan;

          return {
            id: `drd-${periodeStr}-${item.nolg}`,
            thbl: periodeStr,
            nolg: item.nolg,
            pakaiM3: String(volumeM3),
            blokM3: tentukanBlok(volumeM3),
            jmlHargaAir: String(jmlHargaAir),
            beaBeban: String(beaBeban),
            beaAdmin: String(beaAdminDefault),
            airKotor: String(airKotorDefault),
            totalTagihan: String(totalTagihan),
            statusLunas: false,
          };
        });

        await tx.insert(rekeningDrd).values(drdRows).onConflictDoNothing();
        diterbitkan += batch.length;
      }

      // 2. Kunci status pembacaan meter menjadi LOCKED_BILLING
      const idsSiapKunci = siapDitagih.map((c) => c.id);
      if (idsSiapKunci.length > 0) {
        for (let mulai = 0; mulai < idsSiapKunci.length; mulai += UKURAN_BATCH) {
          const chunkIds = idsSiapKunci.slice(mulai, mulai + UKURAN_BATCH);
          await tx
            .update(caterBacaMeter)
            .set({ statusVerifikasi: 'LOCKED_BILLING', updatedAt: new Date() })
            .where(inArray(caterBacaMeter.id, chunkIds));
        }
      }

      // 3. Kunci Periode Penagihan
      await tx
        .insert(periodePenagihan)
        .values({
          periode: periodeStr,
          status: 'TERKUNCI',
          tanggalJatuhTempo,
          ditutupAt: new Date(),
          ditutupById: userId,
          jumlahSl: diterbitkan + setSudahDitagih.size,
          totalM3: String(akumulasiTotalM3),
          totalTagihan: String(akumulasiTotalTagihan),
        })
        .onConflictDoUpdate({
          target: periodePenagihan.periode,
          set: {
            status: 'TERKUNCI',
            tanggalJatuhTempo,
            ditutupAt: new Date(),
            ditutupById: userId,
            jumlahSl: diterbitkan + setSudahDitagih.size,
            totalM3: String(akumulasiTotalM3),
            totalTagihan: String(akumulasiTotalTagihan),
            updatedAt: new Date(),
          },
        });
    });

    return {
      periode: periodeStr,
      tagihanDiterbitkan: diterbitkan,
      tagihanSudahAda: setSudahDitagih.size,
      jumlahSl: diterbitkan + setSudahDitagih.size,
      totalM3: akumulasiTotalM3,
      totalTagihan: akumulasiTotalTagihan,
    };
  }
}

export const closingService = new ClosingService();
