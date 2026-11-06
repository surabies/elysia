/**
 * Service: Analitik & Observabilitas Operasional 3 Pilar PDAM
 * Lapisan: 2. Service Layer (Agregasi Data Time-Series, Histogram & Performa)
 */

import { sql } from 'drizzle-orm';
import { db } from '@cater/db';
import { dashboardService } from './dashboard.service';

export interface DailyTrendItem {
  tanggal: string;
  hari: string;
  label: string;
  total: number;
  normal: number;
  anomali: number;
  kubikasi: number;
  kumulatifAktual: number;
  kumulatifTarget: number;
}

export interface ConsumptionBucket {
  kategori: string;
  label: string;
  minM3: number;
  maxM3: number;
  jumlahSL: number;
  totalM3: number;
  persentase: number;
}

export interface OfficerProductivity {
  kodepetugas: string;
  nama: string;
  totalBaca: number;
  totalKubikasi: number;
  anomaliCount: number;
  persentaseBeban: number;
}

export interface RegionalDailyTrend {
  tanggal: string;
  hari: string;
  karees: number;
  tegallega: number;
  cibeunying: number;
  bojonegara: number;
  total: number;
}

export interface AnomalyCategory {
  kode: string;
  keterangan: string;
  jumlah: number;
  persentase: number;
}

export interface AnalyticsPageData {
  periode: {
    thbl: string;
    label: string;
    bulan: string;
    tahun: string;
  };
  dailyTrends: DailyTrendItem[];
  consumptionBuckets: ConsumptionBucket[];
  officers: OfficerProductivity[];
  regionalTrends: RegionalDailyTrend[];
  anomalies: AnomalyCategory[];
  totalPelanggan: number;
  totalBaca: number;
  totalKubikasi: number;
  rataRataHarian: number;
  puncakHarian: {
    hari: string;
    total: number;
  };
}

export class AnalyticsService {
  /**
   * Mengambil seluruh time-series harian pencatatan meter
   */
  async getDailyTrends(thbl: string, totalTarget: number = 22549): Promise<DailyTrendItem[]> {
    const raw = await db.execute(sql`
      SELECT 
        to_char(tgl_catat, 'YYYY-MM-DD') as tanggal,
        to_char(tgl_catat, 'DD') as hari,
        count(*)::int as total,
        count(CASE WHEN tmss = '01' OR tmss = ' ' OR tmss = '' OR tmss = '-' THEN 1 END)::int as normal,
        count(CASE WHEN tmss NOT IN ('01', ' ', '', '-') THEN 1 END)::int as anomali,
        coalesce(sum(pakai_m3), 0)::float as kubikasi
      FROM cater_baca_meter
      WHERE thbl = ${thbl} AND tgl_catat IS NOT NULL
      GROUP BY to_char(tgl_catat, 'YYYY-MM-DD'), to_char(tgl_catat, 'DD')
      ORDER BY tanggal ASC
    `);

    const rows = raw as any[];
    const totalHari = rows.length || 25;
    const targetPerHari = totalTarget / totalHari;

    let runningAktual = 0;
    let runningTarget = 0;

    return rows.map((r, idx) => {
      const total = Number(r.total || 0);
      runningAktual += total;
      runningTarget += targetPerHari;

      return {
        tanggal: r.tanggal,
        hari: r.hari,
        label: `Tgl ${parseInt(r.hari, 10)}`,
        total,
        normal: Number(r.normal || 0),
        anomali: Number(r.anomali || 0),
        kubikasi: Number(r.kubikasi || 0),
        kumulatifAktual: runningAktual,
        kumulatifTarget: Math.min(totalTarget, Math.round(runningTarget)),
      };
    });
  }

  /**
   * Mengambil histogram sebaran konsumsi kubikasi (Latency-style buckets)
   */
  async getConsumptionBuckets(thbl: string): Promise<ConsumptionBucket[]> {
    const raw = await db.execute(sql`
      SELECT
        CASE 
          WHEN pakai_m3 = 0 THEN '0'
          WHEN pakai_m3 > 0 AND pakai_m3 <= 10 THEN '1-10'
          WHEN pakai_m3 > 10 AND pakai_m3 <= 20 THEN '11-20'
          WHEN pakai_m3 > 20 AND pakai_m3 <= 30 THEN '21-30'
          WHEN pakai_m3 > 30 AND pakai_m3 <= 50 THEN '31-50'
          ELSE '>50'
        END as kategori,
        count(*)::int as jumlah_sl,
        coalesce(sum(pakai_m3), 0)::float as total_m3
      FROM cater_baca_meter
      WHERE thbl = ${thbl}
      GROUP BY kategori
    `);

    const orderMap: Record<string, { label: string; min: number; max: number; idx: number }> = {
      '0': { label: '0 m³ (Nol/Kosong)', min: 0, max: 0, idx: 1 },
      '1-10': { label: '1 - 10 m³ (Minimal)', min: 1, max: 10, idx: 2 },
      '11-20': { label: '11 - 20 m³ (Standar)', min: 11, max: 20, idx: 3 },
      '21-30': { label: '21 - 30 m³ (Menengah)', min: 21, max: 30, idx: 4 },
      '31-50': { label: '31 - 50 m³ (Tinggi)', min: 31, max: 50, idx: 5 },
      '>50': { label: '> 50 m³ (Ekstrim/P99)', min: 51, max: 9999, idx: 6 },
    };

    const rows = raw as any[];
    const totalAllSL = rows.reduce((acc, r) => acc + Number(r.jumlah_sl || 0), 0);

    const bucketList: ConsumptionBucket[] = Object.keys(orderMap).map((key) => {
      const match = rows.find((r) => r.kategori === key);
      const meta = orderMap[key];
      const jumlahSL = match ? Number(match.jumlah_sl || 0) : 0;
      const totalM3 = match ? Number(match.total_m3 || 0) : 0;
      const persentase = totalAllSL > 0 ? Math.round((jumlahSL / totalAllSL) * 1000) / 10 : 0;

      return {
        kategori: key,
        label: meta.label,
        minM3: meta.min,
        maxM3: meta.max,
        jumlahSL,
        totalM3,
        persentase,
      };
    });

    return bucketList.sort((a, b) => orderMap[a.kategori].idx - orderMap[b.kategori].idx);
  }

  /**
   * Mengambil ranking performa & produktivitas 9 Petugas Cater
   */
  async getOfficersProductivity(thbl: string): Promise<OfficerProductivity[]> {
    const raw = await db.execute(sql`
      SELECT 
        p.id as kodepetugas,
        p.nama,
        count(c.nolg)::int as total_baca,
        coalesce(sum(c.pakai_m3), 0)::float as total_kubikasi,
        count(CASE WHEN c.tmss NOT IN ('01', ' ', '', '-') THEN 1 END)::int as anomali_count
      FROM petugas_cater p
      LEFT JOIN cater_baca_meter c ON c.petugas_id = p.id AND c.thbl = ${thbl}
      WHERE p.aktif = true
      GROUP BY p.id, p.nama
      ORDER BY total_baca DESC, p.id ASC
    `);

    const rows = raw as any[];
    const totalSemuaBaca = rows.reduce((sum, r) => sum + Number(r.total_baca || 0), 0);

    return rows.map((r) => {
      const totalBaca = Number(r.total_baca || 0);
      return {
        kodepetugas: r.kodepetugas,
        nama: r.nama,
        totalBaca,
        totalKubikasi: Number(r.total_kubikasi || 0),
        anomaliCount: Number(r.anomali_count || 0),
        persentaseBeban: totalSemuaBaca > 0 ? Math.round((totalBaca / totalSemuaBaca) * 1000) / 10 : 0,
      };
    });
  }

  /**
   * Mengambil tren pembacaan harian terbagi ke 4 Wilayah Administrasi (seperti sample-grafik-2.md)
   */
  async getRegionalTrends(thbl: string): Promise<RegionalDailyTrend[]> {
    const raw = await db.execute(sql`
      SELECT 
        to_char(c.tgl_catat, 'YYYY-MM-DD') as tanggal,
        to_char(c.tgl_catat, 'DD') as hari,
        count(CASE WHEN w.kode = '03' OR w.nama ILIKE '%Karees%' THEN 1 END)::int as karees,
        count(CASE WHEN w.kode = '04' OR w.nama ILIKE '%Tegallega%' THEN 1 END)::int as tegallega,
        count(CASE WHEN w.kode = '02' OR w.nama ILIKE '%Cibeunying%' THEN 1 END)::int as cibeunying,
        count(CASE WHEN w.kode = '01' OR w.nama ILIKE '%Bojonegara%' THEN 1 END)::int as bojonegara,
        count(*)::int as total
      FROM cater_baca_meter c
      LEFT JOIN pelanggan p ON p.nolg = c.nolg
      LEFT JOIN kelurahan kel ON kel.kode = p.kelurahan_kode
      LEFT JOIN kecamatan kec ON kec.kode = kel.kecamatan_kode
      LEFT JOIN wilayah_administrasi w ON w.kode = kec.wiladm_kode
      WHERE c.thbl = ${thbl} AND c.tgl_catat IS NOT NULL
      GROUP BY to_char(c.tgl_catat, 'YYYY-MM-DD'), to_char(c.tgl_catat, 'DD')
      ORDER BY tanggal ASC
    `);

    return (raw as any[]).map((r) => ({
      tanggal: r.tanggal,
      hari: r.hari,
      karees: Number(r.karees || 0),
      tegallega: Number(r.tegallega || 0),
      cibeunying: Number(r.cibeunying || 0),
      bojonegara: Number(r.bojonegara || 0),
      total: Number(r.total || 0),
    }));
  }

  /**
   * Mengambil breakdown anomali & kelainan meter
   */
  async getAnomalyBreakdown(thbl: string): Promise<AnomalyCategory[]> {
    const raw = await db.execute(sql`
      SELECT 
        coalesce(nullif(trim(tmss), ''), '01') as kode,
        count(*)::int as jumlah
      FROM cater_baca_meter
      WHERE thbl = ${thbl}
      GROUP BY coalesce(nullif(trim(tmss), ''), '01')
      ORDER BY jumlah DESC
    `);

    const rows = raw as any[];
    const total = rows.reduce((s, r) => s + Number(r.jumlah || 0), 0);

    const labelMap: Record<string, string> = {
      '01': 'Stand Normal (Dapat Dibaca)',
      '02': 'Pagar Dikunci (DK / Stand Taksir)',
      'DK': 'Pagar Dikunci (DK)',
      '03': 'Rumah Kosong (RK)',
      'RK': 'Rumah Kosong (RK)',
      '07': 'Meter Mati / Rusak (GWM)',
      '08': 'Air Mati / Tidak Mengalir',
      'ANOMALY_NEGATIVE': 'Stand Minus / Rollover',
    };

    return rows.map((r) => {
      const jml = Number(r.jumlah || 0);
      return {
        kode: r.kode,
        keterangan: labelMap[r.kode] || `Kelainan Kode ${r.kode}`,
        jumlah: jml,
        persentase: total > 0 ? Math.round((jml / total) * 1000) / 10 : 0,
      };
    });
  }

  /**
   * Orkestrasi lengkap data analitik untuk halaman /analytics
   */
  async getAnalyticsPageData(): Promise<AnalyticsPageData> {
    const periode = await dashboardService.getActivePeriod();
    const summary = await dashboardService.getExecutiveSummary(periode.thbl);

    const [dailyTrends, consumptionBuckets, officers, regionalTrends, anomalies] =
      await Promise.all([
        this.getDailyTrends(periode.thbl, summary.totalPelanggan),
        this.getConsumptionBuckets(periode.thbl),
        this.getOfficersProductivity(periode.thbl),
        this.getRegionalTrends(periode.thbl),
        this.getAnomalyBreakdown(periode.thbl),
      ]);

    const totalHari = dailyTrends.length || 1;
    const rataRataHarian = Math.round(summary.totalCater / totalHari);

    let peakDay = { hari: '-', total: 0 };
    dailyTrends.forEach((d) => {
      if (d.total > peakDay.total) {
        peakDay = { hari: d.label, total: d.total };
      }
    });

    return {
      periode,
      dailyTrends,
      consumptionBuckets,
      officers,
      regionalTrends,
      anomalies,
      totalPelanggan: summary.totalPelanggan,
      totalBaca: summary.totalCater,
      totalKubikasi: summary.totalKubikasiM3,
      rataRataHarian,
      puncakHarian: peakDay,
    };
  }
}

export const analyticsService = new AnalyticsService();
