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

export interface PeriodeOption extends PeriodeInfo {
  hasData: boolean;
  isCurrentMonth: boolean;
  totalCater: number;
  totalDrd: number;
}

const DAFTAR_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function formatPeriodeInfo(thbl: string): PeriodeInfo {
  const tahun = thbl.slice(0, 4);
  const bulanIndex = parseInt(thbl.slice(4, 6), 10);
  const bulan = DAFTAR_BULAN[bulanIndex - 1] || thbl.slice(4, 6);
  return {
    thbl,
    label: `${bulan} ${tahun}`,
    bulan,
    tahun,
  };
}

export function getCurrentCalendarThbl(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
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
  totalMandiriPeriode: number;
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
  pengaduanTerbuka: {
    total: number;
    darurat: number;
  };
}

export interface KesiapanBilling {
  statusPeriode: string;
  totalCater: number;
  submitted: number;
  needResurvey: number;
  verifiedL1: number;
  verifiedL2: number;
  approvedFinal: number;
  lockedBilling: number;
  persenSiapClosing: number;
}

export class DashboardService {
  /**
   * Mengambil periode (THBL) terbaru yang sudah memiliki data di database
   * (menggunakan ORDER BY thbl DESC agar langsung beralih begitu bulan berjalan mulai di-import)
   */
  async getActivePeriod(): Promise<PeriodeInfo> {
    const raw = await db.execute(sql`
      SELECT coalesce(
        (
          SELECT max(thbl) FROM (
            SELECT thbl FROM cater_baca_meter WHERE thbl IS NOT NULL AND length(trim(thbl)) = 6
            UNION ALL
            SELECT thbl FROM rekening_drd WHERE thbl IS NOT NULL AND length(trim(thbl)) = 6
          ) AS combined_periods
        ),
        to_char(CURRENT_DATE, 'YYYYMM')
      ) AS active_thbl
    `);

    const thbl = String((raw[0] as any)?.active_thbl || getCurrentCalendarThbl());
    return formatPeriodeInfo(thbl);
  }

  /**
   * Mengambil seluruh daftar periode yang tersedia di database (diurutkan terbaru dulu),
   * ditambah bulan kalender berjalan jika belum ada datanya.
   */
  async getAvailablePeriods(): Promise<PeriodeOption[]> {
    const currentThbl = getCurrentCalendarThbl();
    const raw = await db.execute(sql`
      WITH cater_counts AS (
        SELECT thbl, count(*)::int AS total_cater
        FROM cater_baca_meter
        WHERE thbl IS NOT NULL AND length(trim(thbl)) = 6
        GROUP BY thbl
      ),
      drd_counts AS (
        SELECT thbl, count(*)::int AS total_drd
        FROM rekening_drd
        WHERE thbl IS NOT NULL AND length(trim(thbl)) = 6
        GROUP BY thbl
      )
      SELECT
        coalesce(c.thbl, d.thbl) AS thbl,
        coalesce(c.total_cater, 0)::int AS total_cater,
        coalesce(d.total_drd, 0)::int AS total_drd
      FROM cater_counts c
      FULL OUTER JOIN drd_counts d ON c.thbl = d.thbl
      ORDER BY thbl DESC
      LIMIT 24
    `);

    const periodMap = new Map<string, PeriodeOption>();

    for (const row of raw as any[]) {
      const thbl = String(row.thbl || '').trim();
      if (!/^\d{6}$/.test(thbl)) continue;
      const totalCater = Number(row.total_cater || 0);
      const totalDrd = Number(row.total_drd || 0);
      periodMap.set(thbl, {
        ...formatPeriodeInfo(thbl),
        hasData: totalCater > 0 || totalDrd > 0,
        isCurrentMonth: thbl === currentThbl,
        totalCater,
        totalDrd,
      });
    }

    if (!periodMap.has(currentThbl)) {
      periodMap.set(currentThbl, {
        ...formatPeriodeInfo(currentThbl),
        hasData: false,
        isCurrentMonth: true,
        totalCater: 0,
        totalDrd: 0,
      });
    }

    return Array.from(periodMap.values()).sort((a, b) =>
      b.thbl.localeCompare(a.thbl)
    );
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
        (
          SELECT count(*) FROM cater_baca_meter
          WHERE thbl = ${targetThbl}
            AND (
              (upper(trim(coalesce(ket_catat, 'NORMAL'))) IN ('NORMAL', 'STAND-KONSUMEN', 'STAND KONSUMEN')
                AND (tmss IS NULL OR upper(trim(tmss)) IN ('01', 'Z', '', '-')))
              OR upper(trim(coalesce(sumber_catat, ''))) IN ('MANDIRI_WEB', 'MANDIRI_APP')
            )
        )::int AS total_normal,
        (
          SELECT count(*) FROM cater_baca_meter
          WHERE thbl = ${targetThbl}
            AND NOT (
              (upper(trim(coalesce(ket_catat, 'NORMAL'))) IN ('NORMAL', 'STAND-KONSUMEN', 'STAND KONSUMEN')
                AND (tmss IS NULL OR upper(trim(tmss)) IN ('01', 'Z', '', '-')))
              OR upper(trim(coalesce(sumber_catat, ''))) IN ('MANDIRI_WEB', 'MANDIRI_APP')
            )
        )::int AS total_anomali,
        (SELECT coalesce(sum(pakai_m3), 0)::float FROM cater_baca_meter WHERE thbl = ${targetThbl}) AS total_kubikasi,
        (SELECT coalesce(sum(total_tagihan), 0)::float FROM rekening_drd WHERE thbl = ${targetThbl}) AS total_rupiah,
        (SELECT count(*) FROM rute_cater)::int AS total_rute,
        (SELECT count(*) FROM petugas_cater WHERE aktif = true)::int AS total_petugas,
        (SELECT count(*) FROM cater_mandiri_pelanggan WHERE upper(trim(status_verifikasi)) IN ('PENDING', 'MENUNGGU'))::int AS total_mandiri_menunggu,
        (SELECT count(*) FROM cater_mandiri_pelanggan WHERE thbl = ${targetThbl} AND upper(trim(status_verifikasi)) IN ('PENDING', 'APPROVED', 'MENUNGGU'))::int AS total_mandiri_periode
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
      totalMandiriPeriode: Number(row.total_mandiri_periode || 0),
    };
  }

  /**
   * Mengambil breakdown statistik per Kecamatan wilayah pelayanan
   */
  async getWilayahBreakdown(thbl?: string): Promise<WilayahStat[]> {
    const targetThbl = thbl || (await this.getActivePeriod()).thbl;

    const raw = await db.execute(sql`
      SELECT
        k.kode,
        k.nama,
        count(DISTINCT p.nolg)::int AS jumlah_pelanggan,
        coalesce(sum(c.pakai_m3), 0)::float AS total_pakai,
        coalesce(sum(r.total_tagihan), 0)::float AS total_rupiah
      FROM kecamatan k
      LEFT JOIN kelurahan kel ON kel.kecamatan_kode = k.kode
      LEFT JOIN pelanggan p ON p.kelurahan_kode = kel.kode
      LEFT JOIN cater_baca_meter c ON c.nolg = p.nolg AND c.thbl = ${targetThbl}
      LEFT JOIN rekening_drd r ON r.nolg = p.nolg AND r.thbl = ${targetThbl}
      GROUP BY k.kode, k.nama
      ORDER BY jumlah_pelanggan DESC, k.nama ASC
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
        (
          SELECT count(*) FROM cater_baca_meter
          WHERE thbl = ${targetThbl}
            AND (
              status_verifikasi = 'ANOMALY'
              OR NOT (
                (upper(trim(coalesce(ket_catat, 'NORMAL'))) IN ('NORMAL', 'STAND-KONSUMEN', 'STAND KONSUMEN')
                  AND (tmss IS NULL OR upper(trim(tmss)) IN ('01', 'Z', '', '-')))
                OR upper(trim(coalesce(sumber_catat, ''))) IN ('MANDIRI_WEB', 'MANDIRI_APP')
              )
            )
        )::int AS verif_anomali,
        (SELECT count(*) FROM cater_mandiri_pelanggan WHERE upper(trim(status_verifikasi)) IN ('PENDING', 'MENUNGGU'))::int AS mandiri_menunggu,
        (SELECT count(*) FROM pengaduan WHERE status NOT IN ('SELESAI', 'DITUTUP', 'DITOLAK'))::int AS pengaduan_terbuka,
        (SELECT count(*) FROM pengaduan WHERE status NOT IN ('SELESAI', 'DITUTUP', 'DITOLAK') AND prioritas IN ('TINGGI', 'DARURAT'))::int AS pengaduan_darurat
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
      pengaduanTerbuka: {
        total: Number(row.pengaduan_terbuka || 0),
        darurat: Number(row.pengaduan_darurat || 0),
      },
    };
  }

  /**
   * Mengambil status kesiapan billing & distribusi tahapan verifikasi V1-V3 untuk periode aktif
   */
  async getKesiapanBilling(thbl?: string): Promise<KesiapanBilling> {
    const targetThbl = thbl || (await this.getActivePeriod()).thbl;

    const raw = await db.execute(sql`
      SELECT
        coalesce((SELECT status FROM periode_penagihan WHERE periode = ${targetThbl} LIMIT 1), 'BERJALAN') AS status_periode,
        count(*)::int AS total_cater,
        count(*) FILTER (WHERE status_verifikasi IN ('DRAFT', 'SUBMITTED'))::int AS submitted,
        count(*) FILTER (WHERE status_verifikasi = 'NEED_RESURVEY')::int AS need_resurvey,
        count(*) FILTER (WHERE status_verifikasi = 'VERIFIED_L1')::int AS verified_l1,
        count(*) FILTER (WHERE status_verifikasi = 'VERIFIED_L2')::int AS verified_l2,
        count(*) FILTER (WHERE status_verifikasi IN ('APPROVED_FINAL', 'CORRECTED_POST_VERIF'))::int AS approved_final,
        count(*) FILTER (WHERE status_verifikasi = 'LOCKED_BILLING')::int AS locked_billing
      FROM cater_baca_meter
      WHERE thbl = ${targetThbl}
    `);

    const row = (raw[0] || {}) as any;
    const totalCater = Number(row.total_cater || 0);
    const approvedFinal = Number(row.approved_final || 0);
    const lockedBilling = Number(row.locked_billing || 0);
    const siapClosing = approvedFinal + lockedBilling;
    const persenSiapClosing =
      totalCater > 0 ? Math.round((siapClosing / totalCater) * 1000) / 10 : 0;

    return {
      statusPeriode: String(row.status_periode || 'BERJALAN'),
      totalCater,
      submitted: Number(row.submitted || 0),
      needResurvey: Number(row.need_resurvey || 0),
      verifiedL1: Number(row.verified_l1 || 0),
      verifiedL2: Number(row.verified_l2 || 0),
      approvedFinal,
      lockedBilling,
      persenSiapClosing,
    };
  }

  /**
   * Mengambil data terpadu untuk halaman dashboard dalam satu orkestrasi paralel.
   * Jika `requestedThbl` tidak diisi, otomatis menampilkan periode terbaru yang memiliki data.
   */
  async getDashboardData(requestedThbl?: string) {
    const [latestActivePeriode, availablePeriods] = await Promise.all([
      this.getActivePeriod(),
      this.getAvailablePeriods(),
    ]);

    const currentCalendarThbl = getCurrentCalendarThbl();
    const isValidRequested =
      typeof requestedThbl === 'string' && /^\d{6}$/.test(requestedThbl.trim());

    const periode = isValidRequested
      ? formatPeriodeInfo(requestedThbl!.trim())
      : latestActivePeriode;

    const currentMonthOption = availablePeriods.find(
      (p) => p.thbl === currentCalendarThbl
    );
    const isHistoricalFallback =
      periode.thbl !== currentCalendarThbl &&
      !(currentMonthOption?.hasData ?? false);

    const [summary, wilayah, tarif, antrean, kesiapanBilling] = await Promise.all([
      this.getExecutiveSummary(periode.thbl),
      this.getWilayahBreakdown(periode.thbl),
      this.getTarifBreakdown(periode.thbl),
      this.getAntreanTindakan(periode.thbl),
      this.getKesiapanBilling(periode.thbl),
    ]);

    return {
      periode,
      availablePeriods,
      currentCalendarLabel: formatPeriodeInfo(currentCalendarThbl).label,
      isHistoricalFallback,
      summary,
      wilayah,
      tarif,
      antrean,
      kesiapanBilling,
    };
  }
}

export const dashboardService = new DashboardService();
