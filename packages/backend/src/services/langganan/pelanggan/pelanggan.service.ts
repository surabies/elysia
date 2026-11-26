/**
 * Service: Pengolahan Data Pelanggan (Pencarian, Detail, Kontak, & Mutasi Golongan)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM & Query)
 */

import { eq, and, or, ilike, desc, isNull, sql } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
  golonganTarif,
  waterMeter,
  petugasCater,
  sambungKembaliPelanggan,
} from '@cater/db';

export class PelangganService {
  /**
   * Pencarian Cepat Pelanggan (NOLG, NPRS, Nama, atau Alamat)
   */
  async searchPelanggan(keyword: string, limit: number = 30) {
    const q = `%${keyword.trim()}%`;
    return db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noMeter: pelanggan.noMeter,
        noTelp: pelanggan.noTelp,
      })
      .from(pelanggan)
      .where(
        or(
          ilike(pelanggan.nolg, q),
          ilike(pelanggan.nprs, q),
          ilike(pelanggan.nama, q),
          ilike(pelanggan.alamat, q)
        )
      )
      .limit(limit);
  }

  /**
   * Mengambil Detail Profil Pelanggan Beserta Histori Pembacaan & Rekening DRD
   */
  async getDetailPelanggan(nolg: string) {
    const [cust] = await db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        rt: pelanggan.rt,
        rw: pelanggan.rw,
        noTelp: pelanggan.noTelp,
        isMbr: pelanggan.isMbr,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        tarifNama: golonganTarif.nama,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        noMeter: pelanggan.noMeter,
        titikLokasi: pelanggan.titikLokasi,
        catatanVerifikasi: pelanggan.catatanVerifikasi,
      })
      .from(pelanggan)
      .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan dengan nomor ${nolg} tidak ditemukan.`);
    }

    // Riwayat pembacaan 12 bulan terakhir
    const riwayatBaca = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        ketCatat: caterBacaMeter.ketCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        fotoSegelUrl: caterBacaMeter.fotoSegelUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
        lokasiGps: caterBacaMeter.lokasiGps,
        petugasId: caterBacaMeter.petugasId,
        petugasNama: petugasCater.nama,
        ruteKode: caterBacaMeter.ruteKode,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
      })
      .from(caterBacaMeter)
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .where(eq(caterBacaMeter.nolg, nolg))
      .orderBy(desc(caterBacaMeter.thbl))
      .limit(12);

    // Riwayat rekening DRD
    const riwayatDrd = await db
      .select({
        id: rekeningDrd.id,
        thbl: rekeningDrd.thbl,
        pakaiM3: rekeningDrd.pakaiM3,
        jmlHargaAir: rekeningDrd.jmlHargaAir,
        totalTagihan: rekeningDrd.totalTagihan,
        statusLunas: rekeningDrd.statusLunas,
      })
      .from(rekeningDrd)
      .where(eq(rekeningDrd.nolg, nolg))
      .orderBy(desc(rekeningDrd.thbl))
      .limit(12);

    return {
      pelanggan: cust,
      riwayatBaca,
      riwayatDrd,
    };
  }

  /**
   * Update Nomor Telepon / WhatsApp Pelanggan (Menu 3.4 No HP Pel)
   */
  async updateKontak(nolg: string, noTelp: string) {
    const [cust] = await db
      .select({ nolg: pelanggan.nolg })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const cleanTelp = noTelp ? noTelp.trim() : null;

    await db
      .update(pelanggan)
      .set({ noTelp: cleanTelp, updatedAt: new Date() })
      .where(eq(pelanggan.nolg, nolg));

    return {
      nolg,
      noTelp: cleanTelp,
      message: cleanTelp
        ? 'Nomor telepon/WhatsApp pelanggan berhasil diperbarui.'
        : 'Nomor kontak pelanggan telah dikosongkan.',
    };
  }

  /**
   * Mengambil Daftar Pelanggan untuk Validasi Kontak (No HP / WhatsApp)
   * Menyediakan filter status kontak (ALL, VALID, EMPTY, INVALID), pencarian teks, filter rute, pagination, & KPI ringkasan.
   */
  async getDaftarValidasiKontak(params: {
    q?: string;
    status?: 'ALL' | 'VALID' | 'EMPTY' | 'INVALID';
    ruteKode?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(5, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.q?.trim()) {
      const qText = `%${params.q.trim()}%`;
      conditions.push(
        or(
          ilike(pelanggan.nolg, qText),
          ilike(pelanggan.nprs, qText),
          ilike(pelanggan.nama, qText),
          ilike(pelanggan.alamat, qText),
          ilike(pelanggan.noTelp, qText)
        )
      );
    }

    if (params.ruteKode && params.ruteKode !== 'all') {
      conditions.push(eq(pelanggan.ruteKode, params.ruteKode));
    }

    // Saring status kontak
    if (params.status === 'VALID') {
      conditions.push(sql`trim(${pelanggan.noTelp}) ~ '^(\\+?628|08)[0-9]{8,11}$'`);
    } else if (params.status === 'EMPTY') {
      conditions.push(sql`(${pelanggan.noTelp} IS NULL OR trim(${pelanggan.noTelp}) = '' OR trim(${pelanggan.noTelp}) = '-')`);
    } else if (params.status === 'INVALID') {
      conditions.push(
        sql`(${pelanggan.noTelp} IS NOT NULL AND trim(${pelanggan.noTelp}) != '' AND trim(${pelanggan.noTelp}) != '-' AND NOT (trim(${pelanggan.noTelp}) ~ '^(\\+?628|08)[0-9]{8,11}$'))`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Ambil KPI ringkasan (global)
    const [kpi] = await db
      .select({
        total: sql<number>`count(*)::int`,
        valid: sql<number>`count(case when trim(${pelanggan.noTelp}) ~ '^(\\+?628|08)[0-9]{8,11}$' then 1 end)::int`,
        empty: sql<number>`count(case when ${pelanggan.noTelp} is null or trim(${pelanggan.noTelp}) = '' or trim(${pelanggan.noTelp}) = '-' then 1 end)::int`,
        invalid: sql<number>`count(case when ${pelanggan.noTelp} is not null and trim(${pelanggan.noTelp}) != '' and trim(${pelanggan.noTelp}) != '-' and not (trim(${pelanggan.noTelp}) ~ '^(\\+?628|08)[0-9]{8,11}$') then 1 end)::int`,
      })
      .from(pelanggan);

    // 2. Ambil total baris terfilter
    const [filteredCount] = await db
      .select({ totalFiltered: sql<number>`count(*)::int` })
      .from(pelanggan)
      .where(whereClause);

    const totalFiltered = filteredCount?.totalFiltered ?? 0;
    const totalPages = Math.ceil(totalFiltered / limit);

    // 3. Ambil data baris
    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        rt: pelanggan.rt,
        rw: pelanggan.rw,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noMeter: pelanggan.noMeter,
        noTelp: pelanggan.noTelp,
        statusKontak: sql<string>`
          case 
            when ${pelanggan.noTelp} is null or trim(${pelanggan.noTelp}) = '' or trim(${pelanggan.noTelp}) = '-' then 'EMPTY'
            when trim(${pelanggan.noTelp}) ~ '^(\\+?628|08)[0-9]{8,11}$' then 'VALID'
            else 'INVALID'
          end
        `,
      })
      .from(pelanggan)
      .where(whereClause)
      .orderBy(pelanggan.ruteKode, pelanggan.noUrutRute, pelanggan.nolg)
      .limit(limit)
      .offset(offset);

    // Format WA link
    const items = rows.map((r) => {
      let waLink: string | null = null;
      const raw = r.noTelp?.trim() ?? '';
      if (r.statusKontak === 'VALID') {
        let clean = raw.replace(/\D/g, '');
        if (clean.startsWith('08')) {
          clean = '62' + clean.slice(1);
        } else if (clean.startsWith('8')) {
          clean = '62' + clean;
        }
        waLink = `https://wa.me/${clean}`;
      }
      return {
        ...r,
        waLink,
      };
    });

    return {
      kpi: {
        total: kpi?.total ?? 0,
        valid: kpi?.valid ?? 0,
        empty: kpi?.empty ?? 0,
        invalid: kpi?.invalid ?? 0,
      },
      pagination: {
        page,
        limit,
        totalRows: totalFiltered,
        totalPages,
      },
      items,
    };
  }

  /**
   * Modifikasi Kategori Tarif Pelanggan (Menu 3.5 Pindah Jenis Pel)
   */
  async updateGolonganTarif(
    nolg: string,
    tarifKodeBaru: string,
    options?: {
      alasan?: string;
      noSuratPermohonan?: string;
      nikPemohon?: string;
      namaPemohon?: string;
      noHpPemohon?: string;
      tahapPindahTarif?: string;
      petugasSurvei?: string;
      tglSurvei?: string;
      kesimpulanSurvei?: string;
      fotoSurveiUrl?: string;
      catatan?: string;
    }
  ) {
    const [cust] = await db
      .select({
        nolg: pelanggan.nolg,
        tarifKodeLama: pelanggan.tarifKode,
        catatanVerifikasi: pelanggan.catatanVerifikasi,
      })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const tglNow = new Date().toISOString().slice(0, 10);
    const auditLog = `[PINDAH TARIF ${tglNow}] ${cust.tarifKodeLama ?? '-'} -> ${tarifKodeBaru}. ` +
      (options?.alasan ? `Alasan: ${options.alasan}. ` : '') +
      (options?.petugasSurvei ? `Survei: ${options.petugasSurvei} (${options.tglSurvei || tglNow}, Hasil: ${options.kesimpulanSurvei || 'Disetujui'}). ` : '') +
      (options?.noSuratPermohonan ? `No Surat: ${options.noSuratPermohonan}. ` : '') +
      (options?.nikPemohon ? `Pemohon: ${options.namaPemohon || 'Warga'} (NIK: ${options.nikPemohon}). ` : '') +
      (options?.catatan ? `Catatan: ${options.catatan}. ` : '');

    const newCatatan = cust.catatanVerifikasi
      ? `${cust.catatanVerifikasi}\n${auditLog}`
      : auditLog;

    await db
      .update(pelanggan)
      .set({
        tarifKode: tarifKodeBaru,
        catatanVerifikasi: newCatatan,
        updatedAt: new Date(),
      })
      .where(eq(pelanggan.nolg, nolg));

    return {
      nolg,
      tarifKodeLama: cust.tarifKodeLama,
      tarifKodeBaru,
      message: `Golongan tarif berhasil diubah ke ${tarifKodeBaru}.`,
    };
  }

  /**
   * Daftar Pelanggan Tanpa Nomor Meter Valid (no_meter IS NULL) untuk dilengkapi lewat UI
   */
  async getPelangganTanpaMeterValid(limit: number = 100, offset: number = 0) {
    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(pelanggan)
      .where(isNull(pelanggan.noMeter));

    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        ruteKode: pelanggan.ruteKode,
        noMeterAsli: pelanggan.noMeterAsli,
        ukuranMeter: pelanggan.ukuranMeter,
        merkMeter: pelanggan.merkMeter,
        tglPasangMeter: pelanggan.tglPasangMeter,
        perluVerifikasi: pelanggan.perluVerifikasi,
        catatanVerifikasi: pelanggan.catatanVerifikasi,
      })
      .from(pelanggan)
      .where(isNull(pelanggan.noMeter))
      .orderBy(pelanggan.ruteKode, pelanggan.nolg)
      .limit(limit)
      .offset(offset);

    return {
      total: countRow?.total ?? 0,
      items: rows,
    };
  }

  /**
   * Melengkapi / Memperbarui Nomor Meter Valid untuk Pelanggan (termasuk pelanggan yang awalnya no_meter = NULL)
   * Memastikan nomor meter baru tidak dipakai pelanggan lain sebelum membuat baris water_meter dan menautkannya.
   */
  async lengkapiNomorMeterValid(input: {
    nolg: string;
    noMeterBaru: string;
    merk?: string;
    ukuran?: string;
    noSegel?: string;
    tglPasang?: Date;
  }) {
    const { nolg, noMeterBaru, merk, ukuran, noSegel, tglPasang } = input;
    const cleanNoMeter = noMeterBaru.trim();
    if (!cleanNoMeter || cleanNoMeter === '-' || cleanNoMeter === '0' || cleanNoMeter === '00000000') {
      throw new Error(`Nomor meter '${noMeterBaru}' tidak valid.`);
    }

    const [cust] = await db
      .select()
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const [usedByOther] = await db
      .select({ nolg: pelanggan.nolg, nama: pelanggan.nama })
      .from(pelanggan)
      .where(eq(pelanggan.noMeter, cleanNoMeter));

    if (usedByOther && usedByOther.nolg !== nolg) {
      throw new Error(
        `Nomor meter '${cleanNoMeter}' sudah terdaftar pada pelanggan lain (${usedByOther.nolg} - ${usedByOther.nama}).`
      );
    }

    const ukuranFinal = ukuran?.trim() || cust.ukuranMeter || '1/2';
    const merkFinal = merk?.trim() || cust.merkMeter || null;
    const tglPasangFinal = tglPasang || cust.tglPasangMeter || new Date();

    await db.transaction(async (tx) => {
      await tx
        .insert(waterMeter)
        .values({
          noMeter: cleanNoMeter,
          merk: merkFinal,
          ukuran: ukuranFinal,
          noSegel: noSegel ?? null,
          tglPasang: tglPasangFinal,
          kondisi: 'Normal',
        })
        .onConflictDoUpdate({
          target: waterMeter.noMeter,
          set: {
            merk: merkFinal,
            ukuran: ukuranFinal,
            noSegel: noSegel ?? null,
            tglPasang: tglPasangFinal,
          },
        });

      await tx
        .update(pelanggan)
        .set({
          noMeter: cleanNoMeter,
          ukuranMeter: ukuranFinal,
          merkMeter: merkFinal,
          tglPasangMeter: tglPasangFinal,
          perluVerifikasi: false,
          catatanVerifikasi: `[METER TERVERIFIKASI] Nomor meter dilengkapi: ${cleanNoMeter} (sebelumnya: ${cust.noMeterAsli ?? '-'})`,
          updatedAt: new Date(),
        })
        .where(eq(pelanggan.nolg, nolg));
    });

    return {
      nolg,
      noMeter: cleanNoMeter,
      ukuranMeter: ukuranFinal,
      merkMeter: merkFinal,
      message: `Nomor meter ${cleanNoMeter} berhasil ditautkan ke pelanggan ${nolg}.`,
    };
  }

  /**
   * Jalur Resmi Sambung Kembali Pelanggan DICABUT -> PELANGGAN AKTIF & Masuk DPM Periode Open
   */
  async sambungKembali(nolg: string, periodeAktif?: string, catatan?: string) {
    return sambungKembaliPelanggan({ nolg, periodeAktif, catatan });
  }

  /**
   * Eksekusi Mutasi Data Pelanggan (Balik Nama Berkas Valid, Alur Pemutusan 3-Tier, Alamat & GPS)
   */
  async mutasiPelanggan(input: {
    nolg: string;
    nama?: string;
    alamat?: string;
    rt?: string;
    rw?: string;
    status?: string;
    lat?: number;
    lng?: number;
    catatan?: string;
    operatorNama?: string;
    // Data Mutasi Wilayah & Rute Pelayanan Lain
    ruteKodeBaru?: string;
    noUrutRuteBaru?: number;
    alasanMutasiWilayah?: string;
    noSuratMutasiWilayah?: string;
    // Data Balik Nama & Dokumen Valid
    nikKtp?: string;
    noHp?: string;
    jenisDokumen?: string;
    noDokumen?: string;
    lampiranUrl?: string;
    // Data Alur Pemutusan 3-Pihak
    tipePemutusan?: string;
    alasanPemutusan?: string;
    tahapPemutusan?: 'ORDER_LANGGANAN' | 'EKSEKUSI_ZONA' | 'PENGESAHAN_MANAGER' | string;
    standAngkat?: number;
    noSegel?: string;
    petugasEksekusi?: string;
    tglEksekusi?: string;
    fotoBuktiUrl?: string;
  }) {
    const {
      nolg,
      nama,
      alamat,
      rt,
      rw,
      status,
      lat,
      lng,
      catatan,
      operatorNama = 'Petugas Langganan',
      ruteKodeBaru,
      noUrutRuteBaru,
      alasanMutasiWilayah,
      noSuratMutasiWilayah,
      nikKtp,
      noHp,
      jenisDokumen,
      noDokumen,
      lampiranUrl,
      tipePemutusan,
      alasanPemutusan,
      tahapPemutusan,
      standAngkat,
      noSegel,
      petugasEksekusi,
      tglEksekusi,
      fotoBuktiUrl,
    } = input;

    const [cust] = await db
      .select()
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (nama && nama.trim()) updateFields.nama = nama.trim();
    if (noHp && noHp.trim()) updateFields.noTelp = noHp.trim();
    if (alamat && alamat.trim()) updateFields.alamat = alamat.trim();
    if (rt !== undefined) updateFields.rt = rt ? rt.trim() : null;
    if (rw !== undefined) updateFields.rw = rw ? rw.trim() : null;
    if (status && status.trim()) updateFields.status = status.trim();

    // Mutasi Wilayah / Rute Baru
    if (ruteKodeBaru && ruteKodeBaru.trim()) {
      updateFields.ruteKode = ruteKodeBaru.trim();
      if (noUrutRuteBaru !== undefined && noUrutRuteBaru !== null) {
        updateFields.noUrutRute = Number(noUrutRuteBaru);
      }
    }

    if (lat !== undefined && lng !== undefined) {
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        updateFields.titikLokasi = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
      } else {
        updateFields.titikLokasi = null;
      }
    }

    // Konstruksi Berita Acara & Log Dokumen Valid ke catatanVerifikasi
    const nowIso = new Date().toISOString().slice(0, 10);
    const existing = cust.catatanVerifikasi ? `${cust.catatanVerifikasi}\n` : '';
    let logLine = '';

    if (tahapPemutusan === 'ORDER_LANGGANAN') {
      logLine = `[ORDER PEMUTUSAN ${nowIso}] Tipe: ${tipePemutusan || 'Sementara'} | Alasan: ${alasanPemutusan || 'Permohonan Pelanggan'} | KTP: ${nikKtp ?? '-'} | Dokumen Permohonan: ${noDokumen ?? 'Bermaterai'} (${lampiranUrl ?? 'Terlampir'}) | Admin: ${operatorNama} | Status: Menunggu Eksekusi Fisik Zona Distribusi`;
    } else if (tahapPemutusan === 'EKSEKUSI_ZONA') {
      logLine = `[EKSEKUSI FISIK DISTRIBUSI ${nowIso}] Tgl Eksekusi: ${tglEksekusi || nowIso} | Stand Angkat Akhir: ${standAngkat ?? 0} m³ | No. Segel/Meter: ${noSegel ?? '-'} | Teknisi Lapangan: ${petugasEksekusi ?? 'Petugas Distribusi'} | Bukti Foto: ${fotoBuktiUrl ?? 'Terkonfirmasi'} | Status: Menunggu Verifikasi & Pengesahan Manager Langganan`;
    } else if (tahapPemutusan === 'PENGESAHAN_MANAGER') {
      logLine = `[PENGESAHAN PEMUTUSAN ${nowIso}] Status Resmi Master: ${status || 'CABUT METER'} | Disahkan Oleh: Manager Langganan (${operatorNama}) | Tindakan: Sambungan Resmi Dinonaktifkan`;
    } else if (ruteKodeBaru && ruteKodeBaru.trim() && ruteKodeBaru.trim() !== cust.ruteKode) {
      // Log Mutasi Wilayah / Rute Pelayanan Lain
      logLine = `[MUTASI WILAYAH ${nowIso}] Pindah Wilayah/Rute: ${cust.ruteKode ?? '-'} ➔ ${ruteKodeBaru.trim()} | Urutan: ${noUrutRuteBaru ?? '-'} | SK/BA: ${noSuratMutasiWilayah ?? 'BA-MUTASI-WILAYAH'} | Alasan: ${alasanMutasiWilayah ?? 'Pemekaran / Penataan Wilayah'} | Admin: ${operatorNama}${catatan ? ` | Catatan: ${catatan.trim()}` : ''}`;
    } else if (nama && nama.trim() && nama.trim() !== cust.nama) {
      // Log Balik Nama dengan Bukti Dokumen Valid
      logLine = `[BALIK NAMA ${nowIso}] Pemilik Lama: ${cust.nama} ➔ Pemilik Baru: ${nama.trim()} | NIK: ${nikKtp ?? '-'} | HP: ${noHp ?? '-'} | Dokumen Bukti: ${jenisDokumen ?? 'Bukti Kepemilikan'} No: ${noDokumen ?? '-'} | Berkas: ${lampiranUrl ?? 'Terverifikasi Fisik'} | Petugas: ${operatorNama}${catatan ? ` | Catatan: ${catatan.trim()}` : ''}`;
    } else if (catatan && catatan.trim()) {
      logLine = `[MUTASI DATA ${nowIso}] ${catatan.trim()} | Petugas: ${operatorNama}`;
    }

    if (logLine) {
      updateFields.catatanVerifikasi = `${existing}${logLine}`;
    }

    await db
      .update(pelanggan)
      .set(updateFields)
      .where(eq(pelanggan.nolg, nolg));

    return {
      nolg,
      message: 'Data mutasi dan berkas administrasi pelanggan berhasil disimpan.',
      statusSambungan: updateFields.status ?? cust.status,
    };
  }

  /**
   * Mengambil Daftar Pelanggan untuk Validasi Koordinat GPS / Geotagging
   * Menyediakan KPI (total, ber_gps, tanpa_gps), filter rute, status GPS, pencarian, dan pagination.
   */
  async getDaftarValidasiGps(params: {
    q?: string;
    status?: 'ALL' | 'BER_GPS' | 'TANPA_GPS';
    ruteKode?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(5, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.q?.trim()) {
      const qText = `%${params.q.trim()}%`;
      conditions.push(
        or(
          ilike(pelanggan.nolg, qText),
          ilike(pelanggan.nprs, qText),
          ilike(pelanggan.nama, qText),
          ilike(pelanggan.alamat, qText)
        )
      );
    }

    if (params.ruteKode && params.ruteKode !== 'all') {
      conditions.push(eq(pelanggan.ruteKode, params.ruteKode));
    }

    if (params.status === 'BER_GPS') {
      conditions.push(sql`${pelanggan.titikLokasi} IS NOT NULL`);
    } else if (params.status === 'TANPA_GPS') {
      conditions.push(sql`${pelanggan.titikLokasi} IS NULL`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. KPI Ringkasan Spasial Global
    const [kpi] = await db
      .select({
        total: sql<number>`count(*)::int`,
        berGps: sql<number>`count(case when ${pelanggan.titikLokasi} is not null then 1 end)::int`,
        tanpaGps: sql<number>`count(case when ${pelanggan.titikLokasi} is null then 1 end)::int`,
      })
      .from(pelanggan);

    // 2. Total Terfilter
    const [filteredCount] = await db
      .select({ totalFiltered: sql<number>`count(*)::int` })
      .from(pelanggan)
      .where(whereClause);

    const totalFiltered = filteredCount?.totalFiltered ?? 0;
    const totalPages = Math.ceil(totalFiltered / limit);

    // 3. Baris Data Pelanggan Spasial
    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        rt: pelanggan.rt,
        rw: pelanggan.rw,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        noMeter: pelanggan.noMeter,
        noTelp: pelanggan.noTelp,
        hasGps: sql<boolean>`case when ${pelanggan.titikLokasi} is not null then true else false end`,
        lng: sql<number | null>`ST_X(${pelanggan.titikLokasi})`,
        lat: sql<number | null>`ST_Y(${pelanggan.titikLokasi})`,
      })
      .from(pelanggan)
      .where(whereClause)
      .orderBy(pelanggan.ruteKode, pelanggan.noUrutRute, pelanggan.nolg)
      .limit(limit)
      .offset(offset);

    const totalAll = kpi?.total ?? 0;
    const berGpsCount = kpi?.berGps ?? 0;
    const persenKelengkapan = totalAll > 0 ? Math.round((berGpsCount / totalAll) * 100) : 0;

    return {
      kpi: {
        total: totalAll,
        berGps: berGpsCount,
        tanpaGps: kpi?.tanpaGps ?? 0,
        persen: persenKelengkapan,
      },
      pagination: {
        page,
        limit,
        totalRows: totalFiltered,
        totalPages,
      },
      items: rows,
    };
  }

  /**
   * Pemutakhiran Cepat Titik Koordinat GPS Pelanggan (Geotagging)
   */
  async updateTitikGps(
    nolg: string,
    lat: number,
    lng: number,
    options?: { operatorNama?: string; catatan?: string }
  ) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error(`Koordinat GPS tidak valid (${lat}, ${lng}).`);
    }

    const [cust] = await db
      .select({ nolg: pelanggan.nolg, catatanVerifikasi: pelanggan.catatanVerifikasi })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const nowIso = new Date().toISOString().slice(0, 10);
    const logLine = `[GEOTAGGING GPS ${nowIso}] Koordinat Terplot: ${lat.toFixed(6)}, ${lng.toFixed(6)} | Petugas: ${options?.operatorNama || 'Admin GIS / Langganan'}${options?.catatan ? ` | Catatan: ${options.catatan}` : ''}`;
    const newCatatan = cust.catatanVerifikasi ? `${cust.catatanVerifikasi}\n${logLine}` : logLine;

    await db
      .update(pelanggan)
      .set({
        titikLokasi: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
        catatanVerifikasi: newCatatan,
        updatedAt: new Date(),
      })
      .where(eq(pelanggan.nolg, nolg));

    return {
      nolg,
      lat,
      lng,
      message: `Titik koordinat GPS pelanggan ${nolg} berhasil disimpan (${lat.toFixed(6)}, ${lng.toFixed(6)}).`,
    };
  }
}

export const pelangganService = new PelangganService();
