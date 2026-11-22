/**
 * Service: Progress Monitoring & Analitik Kinerja (Wilayah, Petugas, Ekstrim, 0 Kubik, Cek Foto)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM Query & Agregasi Lapangan)
 */

import { eq, sql, desc, and, or, like, ilike } from "drizzle-orm";
import {
  db,
  caterBacaMeter,
  pelanggan,
  ruteCater,
  petugasCater,
  kelurahan,
  kecamatan,
  daftarCatat,
  periodePenagihan,
  getActivePeriode,
} from "@cater/db";

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

export type JenisAnomali = "EKSTRIM" | "NOL" | "TURUN";

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
  fotoSegelUrl?: string | null;
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

export interface AturanBreakdownItem {
  kode: string;
  nama: string;
  tipeAturan: string;
  dihitungSebagaiAnomali: boolean;
  tingkatKeparahan: string;
  badgeTone: string;
  urutan: number;
  jumlah: number;
  persentase: number;
}

export interface AuditPelangganItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string;
  ruteKode: string | null;
  kelurahanNama: string | null;
  stml: number;
  stma: number;
  pakaiM3: number;
  pakaiLalu: number;
  kodeAnomaliUtama: string | null;
  ketCatat: string | null;
  statusVerifikasi: string;
}

export interface AuditAnomaliResult {
  periode: string;
  kpi: {
    totalTercatat: number;
    totalAnomali: number;
    totalWarning: number;
    totalNormal: number;
    persenAnomali: number;
    persenWarning: number;
    persenNormal: number;
  };
  aturanBreakdown: AturanBreakdownItem[];
  pelanggan: AuditPelangganItem[];
  totalPelangganCount: number;
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
  fotoSegelUrl?: string | null;
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
  async getProgressPerWilayah(
    thblParam?: string,
  ): Promise<WilayahProgresResult> {
    const thbl = thblParam || (await getActivePeriode());
    // 0. Cek status siklus penagihan
    const [periodeInfo] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, thbl));

    const isLocked = periodeInfo?.status === "TERKUNCI";

    // 1. Ambil target per kelurahan dari tabel master pelanggan
    const targetRows = await db
      .select({
        kelurahanKode: kelurahan.kode,
        kelurahanNama: kelurahan.nama,
        kecamatanNama: sql<string>`coalesce(${kecamatan.nama}, '-')`,
        totalTarget: sql<number>`count(${pelanggan.nolg})::int`,
      })
      .from(pelanggan)
      .innerJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .leftJoin(kecamatan, eq(kelurahan.kecamatanKode, kecamatan.kode))
      .groupBy(
        kelurahan.kode,
        kelurahan.nama,
        kecamatan.nama
      );

    const targetMap = new Map<
      string,
      { nama: string; kec: string; target: number }
    >();
    for (const r of targetRows) {
      if (!r.kelurahanKode) continue;
      targetMap.set(r.kelurahanKode, {
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
        totalAnomali: sql<number>`count(case when ${caterBacaMeter.isAnomali} = true then 1 end)::int`,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(eq(caterBacaMeter.thbl, thbl))
      .groupBy(
        pelanggan.kelurahanKode,
        caterBacaMeter.ruteKode
      );

    // Agregasikan berdasarkan kelurahan
    const aggMap = new Map<
      string,
      { terbaca: number; totalM3: number; anomali: number; seksi: string }
    >();

    for (const r of readRows) {
      const code = r.kelurahanKode;
      if (!code) continue;
      const prev = aggMap.get(code) ?? {
        terbaca: 0,
        totalM3: 0,
        anomali: 0,
        seksi: r.ruteKode ? r.ruteKode.slice(0, 2) : "-",
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
      if (!code || code === 'UNKNOWN' || code === 'LAINNYA') continue;
      const agg = aggMap.get(code);
      const terbaca = agg?.terbaca ?? 0;
      const target = isLocked ? terbaca : Math.max(info.target, terbaca); // Safety guard
      if (target === 0 && terbaca === 0) continue;
      const sisa = Math.max(0, target - terbaca);
      const persenSelesai =
        target > 0 ? Number(((terbaca / target) * 100).toFixed(1)) : 100;
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
        seksiKode: agg?.seksi ?? "WIL",
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
      grandTarget > 0
        ? Number(((grandTerbaca / grandTarget) * 100).toFixed(1))
        : 0;

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
    thbl: string = "202610",
    jenis?: "all" | "ekstrim" | "nol" | "turun" | "kendala",
    limit: number = 100,
    search?: string,
  ): Promise<AnomaliKubikasiResult> {
    const condition = eq(caterBacaMeter.thbl, thbl);

    // 1. Logika filter kondisi SQL berbasis SSOT is_anomali & aturan deviasi kubikasi
    const ekstrimSql = sql`(${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_LONJAKAN_M3', 'ANOM_LONJAKAN_PERSEN', 'ANOM_LONJAKAN_RELATIF', 'ANOM_METER_MUNDUR') or (${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_DEVIASI_RING3', 'ANOM_DEVIASI_RING_3') and ${caterBacaMeter.pakaiM3} > ${caterBacaMeter.pakaiLalu}) or ${caterBacaMeter.pakaiM3} >= 100)`;
    const nolSql = sql`(${caterBacaMeter.pakaiM3} = 0 or ${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_PEMAKAIAN_NOL', 'ANOM_TIDAK_ADA_AIR_MENDADAK', 'ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN'))`;
    const turunSql = sql`(${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_PENURUNAN_DRASTIS') or (${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_DEVIASI_RING2', 'ANOM_DEVIASI_RING3') and ${caterBacaMeter.pakaiM3} < ${caterBacaMeter.pakaiLalu}) or (${caterBacaMeter.pakaiLalu} >= 10 and ${caterBacaMeter.pakaiM3} > 0 and ${caterBacaMeter.pakaiM3} <= ${caterBacaMeter.pakaiLalu} * 0.5))`;
    const kendalaSql = sql`(${caterBacaMeter.kodeAnomaliUtama} in ('ANOM_KERUSAKAN_METER', 'WARN_KENDALA_AKSES') or ${caterBacaMeter.kodeAnomaliUtama} like 'WARN_%')`;

    // 2. Hitung ringkasan KPI untuk semua anomali di periode aktif berbasis SSOT Aturan
    const kpiRows = await db
      .select({
        totalAnomali: sql<number>`count(case when ${caterBacaMeter.isAnomali} = true then 1 end)::int`,
        totalEkstrim: sql<number>`count(case when ${ekstrimSql} then 1 end)::int`,
        totalNol: sql<number>`count(case when ${nolSql} then 1 end)::int`,
        totalTurun: sql<number>`count(case when ${turunSql} then 1 end)::int`,
        totalKendala: sql<number>`count(case when ${kendalaSql} then 1 end)::int`,
      })
      .from(caterBacaMeter)
      .where(condition);

    const kpiData = kpiRows[0] ?? {
      totalAnomali: 0,
      totalEkstrim: 0,
      totalNol: 0,
      totalTurun: 0,
      totalKendala: 0,
    };
    const totalAnomali = kpiData.totalAnomali;

    // 3. Bangun filter kondisi SQL untuk query data tabel
    let typeFilter = or(sql`${caterBacaMeter.isAnomali} = true`, ekstrimSql, nolSql, turunSql);
    if (jenis === "ekstrim") typeFilter = ekstrimSql;
    else if (jenis === "nol") typeFilter = nolSql;
    else if (jenis === "turun") typeFilter = turunSql;
    else if (jenis === "kendala") typeFilter = kendalaSql;

    const baseWhere = and(condition, typeFilter);

    let finalWhere = baseWhere;
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      finalWhere = and(
        baseWhere,
        or(
          ilike(caterBacaMeter.nolg, q),
          ilike(pelanggan.nama, q),
          ilike(caterBacaMeter.ruteKode, q),
        ),
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
        kodeAnomaliUtama: caterBacaMeter.kodeAnomaliUtama,
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
      .orderBy(
        desc(
          sql`abs(${caterBacaMeter.pakaiM3}::float - coalesce(${caterBacaMeter.pakaiLalu}::float, 0))`,
        ),
      )
      .limit(limit);

    const items: AnomaliKubikasiItem[] = rows.map((r) => {
      const m3 = Number(r.pakaiM3 ?? 0);
      const lalu = Number(r.pakaiLalu ?? 0);
      const selisihM3 = m3 - lalu;
      const persenDeviasi =
        lalu > 0 ? Math.round(((m3 - lalu) / lalu) * 100) : m3 > 0 ? 100 : 0;

      let jenisItem: JenisAnomali = "EKSTRIM";
      const kode = r.kodeAnomaliUtama || "";
      if (
        m3 === 0 ||
        kode === "ANOM_PEMAKAIAN_NOL" ||
        kode === "ANOM_TIDAK_ADA_AIR_MENDADAK" ||
        kode === "ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN"
      ) {
        jenisItem = "NOL";
      } else if (
        kode === "ANOM_PENURUNAN_DRASTIS" ||
        ((kode === "ANOM_DEVIASI_RING2" || kode === "ANOM_DEVIASI_RING3") && m3 < lalu) ||
        (lalu >= 10 && m3 > 0 && m3 <= lalu * 0.5)
      ) {
        jenisItem = "TURUN";
      } else {
        jenisItem = "EKSTRIM";
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
        statusVerifikasi: r.statusVerifikasi ?? "SUBMITTED",
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
   * Audit & Rekonsiliasi Anomali SSOT (konfirmasi.md)
   * Memisahkan secara transparan Anomali Validasi Meter vs Catatan Lapangan & Peringatan Ringan
   */
  async getAuditAnomali(
    thbl: string = "202610",
    filterKode?: string,
    filterKategori?: "all" | "anomali" | "warning" | "normal",
    limit: number = 50,
    offset: number = 0,
    search?: string,
  ): Promise<AuditAnomaliResult> {
    // 1. Ambil ringkasan KPI tingkat tinggi (Pilar 1 vs Pilar 2 vs Normal)
    const rawKpi = await db.execute<any>(sql`
      SELECT
        count(*)::int as total_tercatat,
        count(CASE WHEN is_anomali = true THEN 1 END)::int as total_anomali,
        count(CASE WHEN is_anomali = false AND kode_anomali_utama LIKE 'WARN_%' THEN 1 END)::int as total_warning,
        count(CASE WHEN is_anomali = false AND (kode_anomali_utama IS NULL OR kode_anomali_utama NOT LIKE 'WARN_%') THEN 1 END)::int as total_normal
      FROM cater_baca_meter
      WHERE thbl = ${thbl}
    `);

    const kpiRow = rawKpi[0] as any;
    const totalTercatat = Number(kpiRow?.total_tercatat || 0);
    const totalAnomali = Number(kpiRow?.total_anomali || 0);
    const totalWarning = Number(kpiRow?.total_warning || 0);
    const totalNormal = Number(kpiRow?.total_normal || 0);

    const persenAnomali = totalTercatat > 0 ? Number(((totalAnomali / totalTercatat) * 100).toFixed(1)) : 0;
    const persenWarning = totalTercatat > 0 ? Number(((totalWarning / totalTercatat) * 100).toFixed(1)) : 0;
    const persenNormal = totalTercatat > 0 ? Number(((totalNormal / totalTercatat) * 100).toFixed(1)) : 0;

    // 2. Ambil rincian distribusi seluruh 12 aturan di aturan_anomali
    const breakdownRaw = await db.execute<any>(sql`
      SELECT 
        a.kode,
        a.nama,
        a.tipe_aturan,
        a.dihitung_sebagai_anomali,
        a.tingkat_keparahan,
        a.badge_tone,
        a.urutan,
        coalesce(c.count, 0)::int as jumlah
      FROM aturan_anomali a
      LEFT JOIN (
        SELECT kode_anomali_utama, count(*)::int as count
        FROM cater_baca_meter
        WHERE thbl = ${thbl}
        GROUP BY kode_anomali_utama
      ) c ON c.kode_anomali_utama = a.kode
      ORDER BY a.urutan ASC
    `);

    const aturanBreakdown: AturanBreakdownItem[] = (breakdownRaw as any[]).map((r: any) => {
      const jumlah = Number(r.jumlah || 0);
      const persentase = totalTercatat > 0 ? Number(((jumlah / totalTercatat) * 100).toFixed(1)) : 0;
      return {
        kode: r.kode,
        nama: r.nama,
        tipeAturan: r.tipe_aturan,
        dihitungSebagaiAnomali: Boolean(r.dihitung_sebagai_anomali),
        tingkatKeparahan: r.tingkat_keparahan,
        badgeTone: r.badge_tone,
        urutan: Number(r.urutan),
        jumlah,
        persentase,
      };
    });

    // 3. Query drill-down baris pelanggan dengan filter dinamis
    const baseWhere = [eq(caterBacaMeter.thbl, thbl)];

    if (filterKode && filterKode !== 'all') {
      baseWhere.push(eq(caterBacaMeter.kodeAnomaliUtama, filterKode));
    } else if (filterKategori === 'anomali') {
      baseWhere.push(eq(caterBacaMeter.isAnomali, true));
    } else if (filterKategori === 'warning') {
      baseWhere.push(and(eq(caterBacaMeter.isAnomali, false), sql`${caterBacaMeter.kodeAnomaliUtama} LIKE 'WARN_%'`)!);
    } else if (filterKategori === 'normal') {
      baseWhere.push(and(eq(caterBacaMeter.isAnomali, false), or(sql`${caterBacaMeter.kodeAnomaliUtama} IS NULL`, sql`${caterBacaMeter.kodeAnomaliUtama} NOT LIKE 'WARN_%'`))!);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      baseWhere.push(
        or(
          ilike(caterBacaMeter.nolg, q),
          ilike(pelanggan.nama, q),
          ilike(caterBacaMeter.ruteKode, q),
        )!
      );
    }

    const finalWhere = and(...baseWhere);

    const [totalPelangganRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(finalWhere);

    const totalPelangganCount = Number(totalPelangganRow?.count || 0);

    const rows = await db
      .select({
        id: caterBacaMeter.id,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: caterBacaMeter.ruteKode,
        kelurahanNama: kelurahan.nama,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        kodeAnomaliUtama: caterBacaMeter.kodeAnomaliUtama,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(kelurahan, eq(pelanggan.kelurahanKode, kelurahan.kode))
      .where(finalWhere)
      .orderBy(desc(sql`abs(${caterBacaMeter.pakaiM3}::float - coalesce(${caterBacaMeter.pakaiLalu}::float, 0))`))
      .limit(limit)
      .offset(offset);

    const pelangganList: AuditPelangganItem[] = rows.map((r) => ({
      id: r.id,
      nolg: r.nolg,
      nama: r.nama,
      alamat: r.alamat,
      ruteKode: r.ruteKode ?? null,
      kelurahanNama: r.kelurahanNama ?? null,
      stml: Number(r.stml ?? 0),
      stma: Number(r.stma ?? 0),
      pakaiM3: Number(r.pakaiM3 ?? 0),
      pakaiLalu: Number(r.pakaiLalu ?? 0),
      kodeAnomaliUtama: r.kodeAnomaliUtama ?? null,
      ketCatat: r.ketCatat ?? null,
      statusVerifikasi: r.statusVerifikasi ?? "SUBMITTED",
    }));

    return {
      periode: thbl,
      kpi: {
        totalTercatat,
        totalAnomali,
        totalWarning,
        totalNormal,
        persenAnomali,
        persenWarning,
        persenNormal,
      },
      aturanBreakdown,
      pelanggan: pelangganList,
      totalPelangganCount,
    };
  }

  /**
   * Monitoring & Galeri Cek Foto Petugas Lapangan
   */
  async getCekFotoList(
    thbl: string = "202610",
    filterKondisi?: string,
    ruteKode?: string,
    limit: number = 30,
    offset: number = 0,
    search?: string,
  ): Promise<CekFotoResult> {
    const baseConditions = [eq(caterBacaMeter.thbl, thbl)];

    if (ruteKode && ruteKode !== "all") {
      baseConditions.push(eq(caterBacaMeter.ruteKode, ruteKode));
    }

    if (filterKondisi && filterKondisi !== "all") {
      if (filterKondisi === "normal") {
        baseConditions.push(eq(caterBacaMeter.ketCatat, "Normal"));
      } else if (filterKondisi === "anomali") {
        baseConditions.push(
          sql`${caterBacaMeter.ketCatat} != 'Normal' or ${caterBacaMeter.pakaiM3}::float > 50 or ${caterBacaMeter.pakaiM3}::float = 0`,
        );
      }
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      baseConditions.push(
        or(
          ilike(caterBacaMeter.nolg, q),
          ilike(pelanggan.nama, q),
          ilike(caterBacaMeter.ruteKode, q),
        )!,
      );
    }

    const whereClause = and(...baseConditions);

    // Hitung total dan KPI
    const kpiRows = await db
      .select({
        total: sql<number>`count(*)::int`,
        normal: sql<number>`count(case when ${caterBacaMeter.isAnomali} = false and (${caterBacaMeter.kodeAnomaliUtama} is null or ${caterBacaMeter.kodeAnomaliUtama} not like 'WARN_%') then 1 end)::int`,
        anomali: sql<number>`count(case when ${caterBacaMeter.isAnomali} = true then 1 end)::int`,
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
        fotoSegelUrl: caterBacaMeter.fotoSegelUrl,
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
      petugasNama: r.petugasNama ?? r.petugasId ?? "-",
      kelurahanNama: r.kelurahanNama ?? null,
      stml: Number(r.stml ?? 0),
      stma: Number(r.stma ?? 0),
      pakaiM3: Number(r.pakaiM3 ?? 0),
      ketCatat: r.ketCatat ?? "Normal",
      statusVerifikasi: r.statusVerifikasi ?? "SUBMITTED",
      tglCatat: r.tglCatat,
      fotoMeterUrl: r.fotoMeterUrl,
      fotoSegelUrl: r.fotoSegelUrl,
      fotoRumahUrl: r.fotoRumahUrl,
      jarakPelangganMeter: r.jarakPelangganMeter
        ? Number(r.jarakPelangganMeter)
        : null,
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
    const res = await this.getAnomaliKubikasi(thbl, "ekstrim", limit);
    return res.items;
  }

  async getIkhtisarPemakaianNol(thbl: string, limit: number = 50) {
    const res = await this.getAnomaliKubikasi(thbl, "nol", limit);
    return res.items;
  }

  async getIkhtisarTurun(thbl: string, limit: number = 50) {
    const res = await this.getAnomaliKubikasi(thbl, "turun", limit);
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
          eq(caterBacaMeter.thbl, thbl),
        ),
      )
      .groupBy(petugasCater.id, petugasCater.nama);
  }

  /**
   * Mengambil riwayat seluruh sesi harian siklus pembacaan petugas dari database nyata
   */
  async getRiwayatSesiPetugas(thbl: string = "202611") {
    // 1. Ambil seluruh tanggal siklus kerja catat di periode ini (dinamis, tanpa batasan 20 sesi)
    const dateRows = await db.execute<{ tanggal: string }>(sql`
      SELECT DISTINCT to_char(tgl_catat, 'YYYY-MM-DD') as tanggal
      FROM cater_baca_meter
      WHERE thbl = ${thbl}
      ORDER BY tanggal ASC
    `);
    const dates = dateRows.map((d) => d.tanggal);

    // 2. Ambil data ringkasan tiap petugas resmi dari database nyata (9 petugas cater)
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
        count(distinct r.kode)::int as total_rute
      FROM petugas_cater p
      LEFT JOIN rute_cater r ON p.id = r.pencatat_default
      LEFT JOIN cater_baca_meter c ON p.id = c.petugas_id AND c.thbl = ${thbl}
      WHERE p.id != '-'
      GROUP BY p.id, p.nama
      ORDER BY p.nama ASC
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
        count(case when c.is_anomali = true then 1 end)::int as anomali
      FROM cater_baca_meter c
      WHERE c.thbl = ${thbl}
      GROUP BY c.petugas_id, to_char(c.tgl_catat, 'YYYY-MM-DD')
    `);

    const sessionMap = new Map<string, (typeof sessionRows)[0]>();
    for (const s of sessionRows) {
      sessionMap.set(`${s.petugas_id}_${s.tanggal}`, s);
    }

    const formatTgl = (tglStr: string) => {
      const parts = tglStr.split("-");
      if (parts.length < 3) return tglStr;
      const day = parts[2];
      const monthNum = parseInt(parts[1]!, 10);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      return `${day} ${months[monthNum - 1] || "Bln"}`;
    };

    return officers.map((off) => {
      // Target harian dihitung proporsional dari total beban dibagi jumlah hari siklus kerja
      const targetHarian = Math.max(
        Math.round(off.total_baca / Math.max(dates.length, 1)),
        50,
      );

      const sesiList = dates.map((tgl, sIdx) => {
        const key = `${off.id}_${tgl}`;
        const s = sessionMap.get(key);
        const isTerakhir = sIdx === dates.length - 1;

        if (!s || s.meter_terbaca === 0) {
          return {
            id: `sesi-${off.id}-${sIdx + 1}`,
            tanggal: formatTgl(tgl),
            status: "Dilewati" as const,
            durasiMenit: 0,
            meterTerbaca: 0,
            totalMeter: targetHarian,
            petugasNama: off.nama,
            waktuSelesaiTeks: isTerakhir
              ? "Libur / Tidak ada jadwal"
              : `${dates.length - sIdx} hari lalu`,
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

        let status: "Tuntas" | "Terlambat" | "Gagal" | "Dilewati" = "Tuntas";
        if (durasiMenit > 360) {
          status = "Terlambat";
        } else if (terbaca < Math.round(targetHarian * 0.8)) {
          status = "Terlambat";
        } else if (s.anomali > terbaca * 0.5) {
          status = "Terlambat";
        } else {
          status = "Tuntas";
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
