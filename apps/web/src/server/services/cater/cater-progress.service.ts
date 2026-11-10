/**
 * Service: Progress Monitoring & Analitik Kinerja (Wilayah, Petugas, Ekstrim, 0 Kubik, Cek Foto)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM Query & Agregasi Lapangan)
 */

import { eq, sql, desc, and, or, like, ilike } from 'drizzle-orm';
import {
  db,
  caterBacaMeter,
  pelanggan,
  ruteCater,
  petugasCater,
  kelurahan,
  kecamatan,
  daftarCatat,
} from '@cater/db';

export interface WilayahProgresItem {
  kelurahanKode: string;
  kelurahanNama: string;
  kecamatanNama: string;
  seksiKode: string;
  target: number;
  terbaca: number;
  sisa: number;
  persenSelesai: number;
  totalM3: number;
  totalAnomali: number;
}

export interface WilayahProgresResult {
  periode: string;
  timestamp: string;
  kpi: {
    totalTarget: number;
    totalTerbaca: number;
    totalSisa: number;
    persenRataRata: number;
    totalKubikasi: number;
    totalKelurahan: number;
    totalAnomali: number;
  };
  wilayah: WilayahProgresItem[];
}

export type JenisAnomali = 'EKSTRIM' | 'NOL' | 'TURUN';

export interface AnomaliKubikasiItem {
  id: string;
  thbl: string;
  nolg: string;
  nama: string;
  alamat: string;
  ruteKode: string | null;
  kelurahanNama: string | null;
  petugasNama: string | null;
  stml: number;
  stma: number;
  pakaiM3: number;
  pakaiLalu: number;
  selisihM3: number;
  persenDeviasi: number;
  rataRataHistoris?: number;
  ketCatat: string | null;
  statusVerifikasi: string;
  jenisAnomali: JenisAnomali;
  fotoMeterUrl: string | null;
  fotoRumahUrl: string | null;
  tglCatat: Date | string | null;
}

export interface AnomaliKubikasiResult {
  periode: string;
  kpi: {
    totalAnomali: number;
    totalEkstrim: number;
    totalNol: number;
    totalTurun: number;
  };
  items: AnomaliKubikasiItem[];
}

export interface CekFotoItem {
  id: string;
  thbl: string;
  nolg: string;
  nama: string;
  alamat: string;
  ruteKode: string | null;
  petugasId: string | null;
  petugasNama: string | null;
  kelurahanNama: string | null;
  stml: number;
  stma: number;
  pakaiM3: number;
  ketCatat: string | null;
  statusVerifikasi: string;
  tglCatat: Date | string | null;
  fotoMeterUrl: string | null;
  fotoRumahUrl: string | null;
  jarakPelangganMeter: number | null;
}

export interface CekFotoResult {
  periode: string;
  total: number;
  kpi: {
    totalFoto: number;
    totalNormal: number;
    totalAnomali: number;
    totalVerified: number;
  };
  items: CekFotoItem[];
}

export class CaterProgressService {
  /**
   * Monitoring Progress Pembacaan Meter Per Wilayah / Kelurahan
   */
  async getProgressPerWilayah(thbl: string = '202601'): Promise<WilayahProgresResult> {
    // 1. Ambil target per kelurahan dari tabel master pelanggan
    const targetRows = await db
      .select({
        kelurahanKode: pelanggan.kelurahanKode,
        kelurahanNama: sql<string>`coalesce(${kelurahan.nama}, ${pelanggan.kelurahanKode}, 'LAINNYA')`,
        kecamatanNama: sql<string>`coalesce(${kecamatan.nama}, '-')`,
        totalTarget: sql<number>`count(${pelanggan.nolg})::int`,
      })
      .from(pelanggan)
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .leftJoin(kecamatan, eq(kelurahan.kecamatanKode, kecamatan.kode))
      .groupBy(pelanggan.kelurahanKode, kelurahan.nama, kecamatan.nama);

    const targetMap = new Map<string, { nama: string; kec: string; target: number }>();
    for (const r of targetRows) {
      const code = r.kelurahanKode ?? 'UNKNOWN';
      targetMap.set(code, {
        nama: r.kelurahanNama,
        kec: r.kecamatanNama,
        target: r.totalTarget,
      });
    }

    // 2. Ambil realisasi pembacaan per kelurahan dari caterBacaMeter
    const readRows = await db
      .select({
        kelurahanKode: pelanggan.kelurahanKode,
        ruteKode: caterBacaMeter.ruteKode,
        totalTerbaca: sql<number>`count(${caterBacaMeter.id})::int`,
        totalM3: sql<number>`coalesce(sum(${caterBacaMeter.pakaiM3}::float), 0)::float`,
        totalAnomali: sql<number>`count(case when ${caterBacaMeter.pakaiM3}::float > 50 or ${caterBacaMeter.pakaiM3}::float = 0 or (${caterBacaMeter.ketCatat} is not null and lower(${caterBacaMeter.ketCatat}) not in ('normal', 'nihil', '')) then 1 end)::int`,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(eq(caterBacaMeter.thbl, thbl))
      .groupBy(pelanggan.kelurahanKode, caterBacaMeter.ruteKode);

    // Agregasikan berdasarkan kelurahan
    const aggMap = new Map<
      string,
      { terbaca: number; totalM3: number; anomali: number; seksi: string }
    >();

    for (const r of readRows) {
      const code = r.kelurahanKode ?? 'UNKNOWN';
      const prev = aggMap.get(code) ?? {
        terbaca: 0,
        totalM3: 0,
        anomali: 0,
        seksi: r.ruteKode ? r.ruteKode.slice(0, 2) : '-',
      };
      prev.terbaca += r.totalTerbaca;
      prev.totalM3 += r.totalM3;
      prev.anomali += r.totalAnomali;
      aggMap.set(code, prev);
    }

    let grandTarget = 0;
    let grandTerbaca = 0;
    let grandM3 = 0;
    let grandAnomali = 0;

    const wilayah: WilayahProgresItem[] = [];

    // Gabungkan seluruh target kelurahan
    for (const [code, info] of targetMap.entries()) {
      const agg = aggMap.get(code);
      const terbaca = agg?.terbaca ?? 0;
      const target = Math.max(info.target, terbaca); // Safety guard
      const sisa = Math.max(0, target - terbaca);
      const persenSelesai = target > 0 ? Number(((terbaca / target) * 100).toFixed(1)) : 0;
      const totalM3 = Math.round(agg?.totalM3 ?? 0);
      const totalAnomali = agg?.anomali ?? 0;

      grandTarget += target;
      grandTerbaca += terbaca;
      grandM3 += totalM3;
      grandAnomali += totalAnomali;

      wilayah.push({
        kelurahanKode: code,
        kelurahanNama: info.nama,
        kecamatanNama: info.kec,
        seksiKode: agg?.seksi ?? 'WIL',
        target,
        terbaca,
        sisa,
        persenSelesai,
        totalM3,
        totalAnomali,
      });
    }

    // Urutkan dari capaian terbaca tertinggi
    wilayah.sort((a, b) => b.terbaca - a.terbaca);

    const grandSisa = Math.max(0, grandTarget - grandTerbaca);
    const persenRataRata =
      grandTarget > 0 ? Number(((grandTerbaca / grandTarget) * 100).toFixed(1)) : 0;

    return {
      periode: thbl,
      timestamp: new Date().toISOString(),
      kpi: {
        totalTarget: grandTarget,
        totalTerbaca: grandTerbaca,
        totalSisa: grandSisa,
        persenRataRata,
        totalKubikasi: grandM3,
        totalKelurahan: wilayah.length,
        totalAnomali: grandAnomali,
      },
      wilayah,
    };
  }

  /**
   * Monitoring Anomali Kubikasi (Lonjakan Ekstrem, Pemakaian 0, Turun Drastis, Kendala Lapangan)
   * Logika sinkron 100% dengan aturan Tabel Verifikasi dan dinamis berbasis riwayat Pakai vs Lalu
   */
  async getAnomaliKubikasi(
    thbl: string = '202601',
    jenis?: 'all' | 'ekstrim' | 'nol' | 'turun' | 'kendala',
    limit: number = 100,
    search?: string
  ): Promise<AnomaliKubikasiResult> {
    // 1. Hitung ringkasan KPI untuk semua anomali di periode aktif berbasis Pakai vs Lalu
    const kpiRows = await db
      .select({
        totalEkstrim: sql<number>`count(case when (
          (${caterBacaMeter.pakaiLalu}::float > 0 and ${caterBacaMeter.pakaiM3}::float >= ${caterBacaMeter.pakaiLalu}::float * 2)
          or (${caterBacaMeter.pakaiLalu}::float > 0 and (${caterBacaMeter.pakaiM3}::float - ${caterBacaMeter.pakaiLalu}::float) >= 30)
          or (${caterBacaMeter.pakaiM3}::float > 75)
          or (${caterBacaMeter.statusVerifikasi} in ('ANOMALY', 'ANOMALY_HIGH'))
        ) then 1 end)::int`,
        totalNol: sql<number>`count(case when ${caterBacaMeter.pakaiM3}::float = 0 or ${caterBacaMeter.statusVerifikasi} = 'ANOMALY_LOW' then 1 end)::int`,
        totalTurun: sql<number>`count(case when ${caterBacaMeter.pakaiLalu} is not null and ${caterBacaMeter.pakaiLalu}::float >= 10 and (${caterBacaMeter.pakaiM3}::float <= ${caterBacaMeter.pakaiLalu}::float * 0.5) then 1 end)::int`,
        totalKendala: sql<number>`count(case when ${caterBacaMeter.ketCatat} is not null and lower(${caterBacaMeter.ketCatat}) not in ('normal', 'nihil', '') then 1 end)::int`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl));

    const kpiData = kpiRows[0] ?? { totalEkstrim: 0, totalNol: 0, totalTurun: 0, totalKendala: 0 };
    const totalAnomali = kpiData.totalEkstrim + kpiData.totalNol + kpiData.totalTurun;

    // 2. Bangun filter kondisi SQL berbasis perbandingan riil Pakai vs Lalu
    let condition = eq(caterBacaMeter.thbl, thbl);

    const ekstrimSql = sql`(
      (${caterBacaMeter.pakaiLalu}::float > 0 and ${caterBacaMeter.pakaiM3}::float >= ${caterBacaMeter.pakaiLalu}::float * 2)
      or (${caterBacaMeter.pakaiLalu}::float > 0 and (${caterBacaMeter.pakaiM3}::float - ${caterBacaMeter.pakaiLalu}::float) >= 30)
      or (${caterBacaMeter.pakaiM3}::float > 75)
      or (${caterBacaMeter.statusVerifikasi} in ('ANOMALY', 'ANOMALY_HIGH'))
    )`;
    const nolSql = sql`(${caterBacaMeter.pakaiM3}::float = 0 or ${caterBacaMeter.statusVerifikasi} = 'ANOMALY_LOW')`;
    const turunSql = sql`(${caterBacaMeter.pakaiLalu} is not null and ${caterBacaMeter.pakaiLalu}::float >= 10 and (${caterBacaMeter.pakaiM3}::float <= ${caterBacaMeter.pakaiLalu}::float * 0.5))`;
    const kendalaSql = sql`(${caterBacaMeter.ketCatat} is not null and lower(${caterBacaMeter.ketCatat}) not in ('normal', 'nihil', ''))`;

    let typeFilter = or(ekstrimSql, nolSql, turunSql, kendalaSql);
    if (jenis === 'ekstrim') typeFilter = ekstrimSql;
    else if (jenis === 'nol') typeFilter = nolSql;
    else if (jenis === 'turun') typeFilter = turunSql;
    else if (jenis === 'kendala') typeFilter = kendalaSql;

    const baseWhere = and(condition, typeFilter);

    let finalWhere = baseWhere;
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      finalWhere = and(
        baseWhere,
        or(
          ilike(caterBacaMeter.nolg, q),
          ilike(pelanggan.nama, q),
          ilike(caterBacaMeter.ruteKode, q)
        )
      );
    }

    const rows = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: caterBacaMeter.ruteKode,
        kelurahanNama: kelurahan.nama,
        petugasNama: petugasCater.nama,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
        tglCatat: caterBacaMeter.tglCatat,
        rataRataHistoris: sql<number>`coalesce(
          (
            select round(avg(c_hist.pakai_m3::float))::int
            from cater_baca_meter c_hist
            where c_hist.nolg = ${caterBacaMeter.nolg}
              and c_hist.thbl < ${thbl}
          ),
          round(${caterBacaMeter.pakaiLalu}::float)::int,
          0
        )`,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .where(finalWhere)
      .orderBy(desc(sql`abs(${caterBacaMeter.pakaiM3}::float - coalesce(${caterBacaMeter.pakaiLalu}::float, 0))`))
      .limit(limit);

    const items: AnomaliKubikasiItem[] = rows.map((r) => {
      const m3 = Number(r.pakaiM3 ?? 0);
      const lalu = Number(r.pakaiLalu ?? 0);
      const selisihM3 = m3 - lalu;
      const persenDeviasi = lalu > 0 ? Math.round(((m3 - lalu) / lalu) * 100) : m3 > 0 ? 100 : 0;

      let jenisItem: JenisAnomali = 'EKSTRIM';
      if (m3 === 0) {
        jenisItem = 'NOL';
      } else if (lalu >= 10 && m3 <= lalu * 0.5) {
        jenisItem = 'TURUN';
      } else if (
        (lalu > 0 && m3 >= lalu * 2) ||
        (lalu > 0 && selisihM3 >= 30) ||
        m3 > 75 ||
        r.statusVerifikasi === 'ANOMALY_HIGH'
      ) {
        jenisItem = 'EKSTRIM';
      }

      return {
        id: r.id,
        thbl: r.thbl,
        nolg: r.nolg,
        nama: r.nama,
        alamat: r.alamat,
        ruteKode: r.ruteKode ?? null,
        kelurahanNama: r.kelurahanNama ?? null,
        petugasNama: r.petugasNama ?? null,
        stml: Number(r.stml ?? 0),
        stma: Number(r.stma ?? 0),
        pakaiM3: m3,
        pakaiLalu: lalu,
        selisihM3,
        persenDeviasi,
        rataRataHistoris: Number(r.rataRataHistoris ?? lalu),
        ketCatat: r.ketCatat ?? null,
        statusVerifikasi: r.statusVerifikasi ?? 'SUBMITTED',
        jenisAnomali: jenisItem,
        fotoMeterUrl: r.fotoMeterUrl ?? null,
        fotoRumahUrl: r.fotoRumahUrl ?? null,
        tglCatat: r.tglCatat,
      };
    });

    return {
      periode: thbl,
      kpi: {
        totalAnomali,
        totalEkstrim: kpiData.totalEkstrim,
        totalNol: kpiData.totalNol,
        totalTurun: kpiData.totalTurun,
      },
      items,
    };
  }

  /**
   * Monitoring & Galeri Cek Foto Petugas Lapangan
   */
  async getCekFotoList(
    thbl: string = '202601',
    filterKondisi?: string,
    ruteKode?: string,
    limit: number = 30,
    offset: number = 0,
    search?: string
  ): Promise<CekFotoResult> {
    const baseConditions = [eq(caterBacaMeter.thbl, thbl)];

    if (ruteKode && ruteKode !== 'all') {
      baseConditions.push(eq(caterBacaMeter.ruteKode, ruteKode));
    }

    if (filterKondisi && filterKondisi !== 'all') {
      if (filterKondisi === 'normal') {
        baseConditions.push(eq(caterBacaMeter.ketCatat, 'Normal'));
      } else if (filterKondisi === 'anomali') {
        baseConditions.push(sql`${caterBacaMeter.ketCatat} != 'Normal' or ${caterBacaMeter.pakaiM3}::float > 50 or ${caterBacaMeter.pakaiM3}::float = 0`);
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      baseConditions.push(
        or(
          ilike(caterBacaMeter.nolg, q),
          ilike(pelanggan.nama, q),
          ilike(caterBacaMeter.ruteKode, q)
        )!
      );
    }

    const whereClause = and(...baseConditions);

    // Hitung total dan KPI
    const kpiRows = await db
      .select({
        total: sql<number>`count(*)::int`,
        normal: sql<number>`count(case when ${caterBacaMeter.ketCatat} = 'Normal' then 1 end)::int`,
        anomali: sql<number>`count(case when ${caterBacaMeter.ketCatat} != 'Normal' or ${caterBacaMeter.pakaiM3}::float > 50 or ${caterBacaMeter.pakaiM3}::float = 0 then 1 end)::int`,
        verified: sql<number>`count(case when ${caterBacaMeter.statusVerifikasi} = 'VERIFIED' then 1 end)::int`,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(whereClause);

    const kpi = kpiRows[0] ?? { total: 0, normal: 0, anomali: 0, verified: 0 };

    const rows = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
        petugasNama: petugasCater.nama,
        kelurahanNama: kelurahan.nama,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
        jarakPelangganMeter: caterBacaMeter.jarakPelangganMeter,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .where(whereClause)
      .orderBy(desc(caterBacaMeter.tglCatat))
      .limit(limit)
      .offset(offset);

    const items: CekFotoItem[] = rows.map((r) => ({
      id: r.id,
      thbl: r.thbl,
      nolg: r.nolg,
      nama: r.nama,
      alamat: r.alamat,
      ruteKode: r.ruteKode,
      petugasId: r.petugasId,
      petugasNama: r.petugasNama ?? r.petugasId ?? '-',
      kelurahanNama: r.kelurahanNama ?? null,
      stml: Number(r.stml ?? 0),
      stma: Number(r.stma ?? 0),
      pakaiM3: Number(r.pakaiM3 ?? 0),
      ketCatat: r.ketCatat ?? 'Normal',
      statusVerifikasi: r.statusVerifikasi ?? 'SUBMITTED',
      tglCatat: r.tglCatat,
      fotoMeterUrl: r.fotoMeterUrl,
      fotoRumahUrl: r.fotoRumahUrl,
      jarakPelangganMeter: r.jarakPelangganMeter ? Number(r.jarakPelangganMeter) : null,
    }));

    return {
      periode: thbl,
      total: kpi.total,
      kpi: {
        totalFoto: kpi.total,
        totalNormal: kpi.normal,
        totalAnomali: kpi.anomali,
        totalVerified: kpi.verified,
      },
      items,
    };
  }

  // Legacy compatibility methods
  async getIkhtisarEkstrim(thbl: string, limit: number = 50) {
    const res = await this.getAnomaliKubikasi(thbl, 'ekstrim', limit);
    return res.items;
  }

  async getIkhtisarPemakaianNol(thbl: string, limit: number = 50) {
    const res = await this.getAnomaliKubikasi(thbl, 'nol', limit);
    return res.items;
  }

  async getIkhtisarTurun(thbl: string, limit: number = 50) {
    const res = await this.getAnomaliKubikasi(thbl, 'turun', limit);
    return res.items;
  }

  async getProgressPerCater(thbl: string) {
    return db
      .select({
        petugasId: petugasCater.id,
        petugasNama: petugasCater.nama,
        totalTercatat: sql<number>`count(${caterBacaMeter.id})::int`,
        totalPakaiM3: sql<number>`coalesce(sum(${caterBacaMeter.pakaiM3}::float), 0)::float`,
        totalNormal: sql<number>`count(case when ${caterBacaMeter.ketCatat} = 'Normal' then 1 end)::int`,
        totalKelainan: sql<number>`count(case when ${caterBacaMeter.ketCatat} != 'Normal' then 1 end)::int`,
      })
      .from(petugasCater)
      .leftJoin(
        caterBacaMeter,
        and(
          eq(petugasCater.id, caterBacaMeter.petugasId),
          eq(caterBacaMeter.thbl, thbl)
        )
      )
      .groupBy(petugasCater.id, petugasCater.nama);
  }

  /**
   * Mengambil riwayat seluruh sesi harian siklus pembacaan petugas dari database nyata
   */
  async getRiwayatSesiPetugas(thbl: string = '202601') {
    // 1. Ambil seluruh tanggal siklus kerja catat di periode ini (dinamis, tanpa batasan 20 sesi)
    const dateRows = await db.execute<{ tanggal: string }>(sql`
      SELECT DISTINCT to_char(tgl_catat, 'YYYY-MM-DD') as tanggal
      FROM cater_baca_meter
      WHERE thbl = ${thbl}
      ORDER BY tanggal ASC
    `);
    const dates = dateRows.map((d) => d.tanggal);

    // 2. Ambil data ringkasan tiap petugas
    const officers = await db.execute<{
      id: string;
      nama: string;
      total_baca: number;
      total_rute: number;
    }>(sql`
      SELECT 
        p.id,
        p.nama,
        count(c.id)::int as total_baca,
        count(distinct c.rute_kode)::int as total_rute
      FROM petugas_cater p
      JOIN cater_baca_meter c ON p.id = c.petugas_id AND c.thbl = ${thbl}
      GROUP BY p.id, p.nama
      ORDER BY total_baca DESC
    `);

    // 3. Ambil data sesi per tanggal untuk semua petugas
    const sessionRows = await db.execute<{
      petugas_id: string;
      tanggal: string;
      meter_terbaca: number;
      rentang_menit: number;
      anomali: number;
    }>(sql`
      SELECT 
        c.petugas_id,
        to_char(c.tgl_catat, 'YYYY-MM-DD') as tanggal,
        count(c.id)::int as meter_terbaca,
        round(coalesce(extract(epoch from (max(c.tgl_catat) - min(c.tgl_catat))) / 60, 0))::int as rentang_menit,
        count(case when c.ket_catat != 'Normal' or c.pakai_m3::float > 50 or c.pakai_m3::float = 0 then 1 end)::int as anomali
      FROM cater_baca_meter c
      WHERE c.thbl = ${thbl}
      GROUP BY c.petugas_id, to_char(c.tgl_catat, 'YYYY-MM-DD')
    `);

    const sessionMap = new Map<string, typeof sessionRows[0]>();
    for (const s of sessionRows) {
      sessionMap.set(`${s.petugas_id}_${s.tanggal}`, s);
    }

    const formatTgl = (tglStr: string) => {
      const parts = tglStr.split('-');
      if (parts.length < 3) return tglStr;
      const day = parts[2];
      const monthNum = parseInt(parts[1]!, 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[monthNum - 1] || 'Bln'}`;
    };

    return officers.map((off) => {
      // Target harian dihitung proporsional dari total beban dibagi jumlah hari siklus kerja
      const targetHarian = Math.max(
        Math.round(off.total_baca / Math.max(dates.length, 1)),
        50
      );

      const sesiList = dates.map((tgl, sIdx) => {
        const key = `${off.id}_${tgl}`;
        const s = sessionMap.get(key);
        const isTerakhir = sIdx === dates.length - 1;

        if (!s || s.meter_terbaca === 0) {
          return {
            id: `sesi-${off.id}-${sIdx + 1}`,
            tanggal: formatTgl(tgl),
            status: 'Dilewati' as const,
            durasiMenit: 0,
            meterTerbaca: 0,
            totalMeter: targetHarian,
            petugasNama: off.nama,
            waktuSelesaiTeks: isTerakhir ? 'Libur / Tidak ada jadwal' : `${dates.length - sIdx} hari lalu`,
          };
        }

        const terbaca = s.meter_terbaca;

        // Perhitungan durasi kerja lapangan (wajar 1–6 jam):
        // Jika rentang_menit wajar (30 - 420 menit), gunakan rentang_menit.
        // Jika terdapat anomali jam upload sistem (misal > 7 jam), hitung durasi efektif berbasis volume bacaan (~1.4 menit/SL).
        let durasiMenit = s.rentang_menit;
        if (durasiMenit <= 0 || durasiMenit > 420) {
          durasiMenit = Math.min(360, Math.max(75, Math.round(terbaca * 1.4)));
        }

        let status: 'Tuntas' | 'Terlambat' | 'Gagal' | 'Dilewati' = 'Tuntas';
        if (durasiMenit > 360) {
          status = 'Terlambat';
        } else if (terbaca < Math.round(targetHarian * 0.8)) {
          status = 'Terlambat';
        } else if (s.anomali > terbaca * 0.5) {
          status = 'Terlambat';
        } else {
          status = 'Tuntas';
        }

        return {
          id: `sesi-${off.id}-${sIdx + 1}`,
          tanggal: formatTgl(tgl),
          status,
          durasiMenit,
          meterTerbaca: terbaca,
          totalMeter: targetHarian,
          petugasNama: off.nama,
          waktuSelesaiTeks: isTerakhir
            ? `Sesi ${formatTgl(tgl)}`
            : `${dates.length - sIdx} hari lalu`,
        };
      });

      return {
        id: `petugas-${off.id}`,
        nama: `Petugas ${off.nama}`,
        seksiWilayah: `wilayah operasional · ${off.total_rute} rute binaan`,
        jumlahPelanggan: off.total_baca,
        petugasDefault: off.nama,
        isNonaktif: false,
        sesiList,
      };
    });
  }
}

export const caterProgressService = new CaterProgressService();
