/**
 * Service: Dashboard & Ringkasan Eksekutif Terpadu PDAM
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM Query & Agregasi Real-Time)
 */

import { sql } from 'drizzle-orm';
import { db } from '@cater/db';

export interface PeriodeInfo {
  thbl: string;
  label: string;
  bulan: string;
  tahun: string;
}

export interface DashboardMetricSummary {
  totalPelanggan: number;
  totalCater: number;
  totalNormal: number;
  totalAnomali: number;
  persenSelesai: number;
  totalKubikasiM3: number;
  totalRupiahDrd: number;
  totalRute: number;
  totalPetugas: number;
  totalMandiriMenunggu: number;
}

export interface WilayahStat {
  kode: string;
  nama: string;
  totalPelanggan: number;
  totalPakaiM3: number;
  totalRupiah: number;
  persentasePelanggan: number;
}

export interface TarifStat {
  kode: string;
  nama: string;
  totalPelanggan: number;
  totalPakaiM3: number;
  totalRupiah: number;
}

export interface AntreanTindakan {
  verifikasiMenunggu: {
    total: number;
    anomaliKritis: number;
  };
  laporanMandiri: {
    total: number;
  };
}

export class DashboardService {
  /**
   * Mengambil periode (THBL) operasional aktif dari database
   * Berdasarkan periode tagihan DRD dan pembacaan cater terbesar/terbaru
   */
  async getActivePeriod(): Promise<PeriodeInfo> {
    const raw = await db.execute(sql`
      SELECT coalesce(
        (SELECT thbl FROM rekening_drd GROUP BY thbl ORDER BY count(*) DESC LIMIT 1),
        (SELECT thbl FROM cater_baca_meter GROUP BY thbl ORDER BY count(*) DESC LIMIT 1),
        to_char(CURRENT_DATE, 'YYYYMM')
      ) as active_thbl
    `);

    const thbl = String((raw[0] as any)?.active_thbl || '202601');
    const tahun = thbl.slice(0, 4);
    const bulanIndex = parseInt(thbl.slice(4, 6), 10);
    const daftarBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const bulan = daftarBulan[bulanIndex - 1] || thbl.slice(4, 6);

    return {
      thbl,
      label: `${bulan} ${tahun}`,
      bulan,
      tahun,
    };
  }

  /**
   * Mengambil seluruh ringkasan KPI eksekutif langsung dari PostgreSQL
   */
  async getExecutiveSummary(thbl?: string): Promise<DashboardMetricSummary> {
    const targetThbl = thbl || (await this.getActivePeriod()).thbl;

    const raw = await db.execute(sql`
      SELECT
        (SELECT count(*) FROM pelanggan)::int AS total_pelanggan,
        (SELECT count(*) FROM cater_baca_meter WHERE thbl = ${targetThbl})::int AS total_cater,
        (SELECT count(*) FROM cater_baca_meter WHERE thbl = ${targetThbl} AND (upper(trim(coalesce(ket_catat, 'NORMAL'))) = 'NORMAL' AND (tmss IS NULL OR tmss IN ('01', ' ', '', '-'))))::int AS total_normal,
        (SELECT count(*) FROM cater_baca_meter WHERE thbl = ${targetThbl} AND (upper(trim(coalesce(ket_catat, 'NORMAL'))) <> 'NORMAL' OR (tmss IS NOT NULL AND tmss NOT IN ('01', ' ', '', '-'))))::int AS total_anomali,
        (SELECT coalesce(sum(pakai_m3), 0)::float FROM cater_baca_meter WHERE thbl = ${targetThbl}) AS total_kubikasi,
        (SELECT coalesce(sum(total_tagihan), 0)::float FROM rekening_drd WHERE thbl = ${targetThbl}) AS total_rupiah,
        (SELECT count(*) FROM rute_cater)::int AS total_rute,
        (SELECT count(*) FROM petugas_cater WHERE aktif = true)::int AS total_petugas,
        (SELECT count(*) FROM cater_mandiri_pelanggan WHERE status_verifikasi = 'MENUNGGU')::int AS total_mandiri_menunggu
    `);

    const row = (raw[0] || {}) as any;
    const totalPelanggan = Number(row.total_pelanggan || 0);
    const totalCater = Number(row.total_cater || 0);
    const persenSelesai = totalPelanggan > 0 ? Math.min(100, Math.round((totalCater / totalPelanggan) * 1000) / 10) : 0;

    return {
      totalPelanggan,
      totalCater,
      totalNormal: Number(row.total_normal || 0),
      totalAnomali: Number(row.total_anomali || 0),
      persenSelesai,
      totalKubikasiM3: Number(row.total_kubikasi || 0),
      totalRupiahDrd: Number(row.total_rupiah || 0),
      totalRute: Number(row.total_rute || 0),
      totalPetugas: Number(row.total_petugas || 0),
      totalMandiriMenunggu: Number(row.total_mandiri_menunggu || 0),
    };
  }

  /**
   * Mengambil breakdown statistik per wilayah administrasi (Bojonegara, Cibeunying, Karees, Tegallega)
   */
  async getWilayahBreakdown(thbl?: string): Promise<WilayahStat[]> {
    const targetThbl = thbl || (await this.getActivePeriod()).thbl;

    const raw = await db.execute(sql`
      SELECT 
        w.kode, 
        w.nama, 
        count(DISTINCT p.nolg)::int as jumlah_pelanggan, 
        coalesce(sum(c.pakai_m3), 0)::float as total_pakai, 
        coalesce(sum(r.total_tagihan), 0)::float as total_rupiah 
      FROM wilayah_administrasi w 
      LEFT JOIN kecamatan k ON k.wiladm_kode = w.kode 
      LEFT JOIN kelurahan kel ON kel.kecamatan_kode = k.kode 
      LEFT JOIN pelanggan p ON p.kelurahan_kode = kel.kode 
      LEFT JOIN cater_baca_meter c ON c.nolg = p.nolg AND c.thbl = ${targetThbl}
      LEFT JOIN rekening_drd r ON r.nolg = p.nolg AND r.thbl = ${targetThbl}
      GROUP BY w.kode, w.nama 
      ORDER BY w.kode
    `);

    const totalAll = (raw as any[]).reduce((sum, r) => sum + Number(r.jumlah_pelanggan || 0), 0);

    return (raw as any[]).map((r) => ({
      kode: r.kode,
      nama: r.nama,
      totalPelanggan: Number(r.jumlah_pelanggan || 0),
      totalPakaiM3: Number(r.total_pakai || 0),
      totalRupiah: Number(r.total_rupiah || 0),
      persentasePelanggan: totalAll > 0 ? Math.round((Number(r.jumlah_pelanggan || 0) / totalAll) * 1000) / 10 : 0,
    }));
  }

  /**
   * Mengambil breakdown golongan tarif pelanggan dominan (Top 6)
   */
  async getTarifBreakdown(thbl?: string): Promise<TarifStat[]> {
    const targetThbl = thbl || (await this.getActivePeriod()).thbl;

    const raw = await db.execute(sql`
      SELECT 
        p.tarif_kode as kode, 
        coalesce(t.nama, p.tarif_kode) as nama, 
        count(DISTINCT p.nolg)::int as total_pelanggan, 
        coalesce(sum(c.pakai_m3), 0)::float as total_pakai, 
        coalesce(sum(r.total_tagihan), 0)::float as total_rupiah 
      FROM pelanggan p 
      LEFT JOIN golongan_tarif t ON t.kode = p.tarif_kode 
      LEFT JOIN cater_baca_meter c ON c.nolg = p.nolg AND c.thbl = ${targetThbl}
      LEFT JOIN rekening_drd r ON r.nolg = p.nolg AND r.thbl = ${targetThbl}
      GROUP BY p.tarif_kode, t.nama 
      ORDER BY total_pelanggan DESC 
      LIMIT 6
    `);

    return (raw as any[]).map((r) => ({
      kode: r.kode,
      nama: r.nama,
      totalPelanggan: Number(r.total_pelanggan || 0),
      totalPakaiM3: Number(r.total_pakai || 0),
      totalRupiah: Number(r.total_rupiah || 0),
    }));
  }

  /**
   * Mengambil antrean pekerjaan operasional / task queue
   */
  async getAntreanTindakan(thbl?: string): Promise<AntreanTindakan> {
    const targetThbl = thbl || (await this.getActivePeriod()).thbl;

    const raw = await db.execute(sql`
      SELECT
        (SELECT count(*) FROM cater_baca_meter WHERE thbl = ${targetThbl} AND status_verifikasi = 'SUBMITTED')::int AS verif_menunggu,
        (SELECT count(*) FROM cater_baca_meter WHERE thbl = ${targetThbl} AND (status_verifikasi = 'ANOMALY' OR upper(trim(coalesce(ket_catat, 'NORMAL'))) <> 'NORMAL' OR (tmss IS NOT NULL AND tmss NOT IN ('01', ' ', '', '-'))))::int AS verif_anomali,
        (SELECT count(*) FROM cater_mandiri_pelanggan WHERE status_verifikasi = 'MENUNGGU')::int AS mandiri_menunggu
    `);

    const row = (raw[0] || {}) as any;

    return {
      verifikasiMenunggu: {
        total: Number(row.verif_menunggu || 0),
        anomaliKritis: Number(row.verif_anomali || 0),
      },
      laporanMandiri: {
        total: Number(row.mandiri_menunggu || 0),
      },
    };
  }

  /**
   * Mengambil data terpadu untuk halaman dashboard dalam satu orkestrasi paralel
   */
  async getDashboardData() {
    const periode = await this.getActivePeriod();
    const [summary, wilayah, tarif, antrean] = await Promise.all([
      this.getExecutiveSummary(periode.thbl),
      this.getWilayahBreakdown(periode.thbl),
      this.getTarifBreakdown(periode.thbl),
      this.getAntreanTindakan(periode.thbl),
    ]);

    return {
      periode,
      summary,
      wilayah,
      tarif,
      antrean,
    };
  }
}

export const dashboardService = new DashboardService();
