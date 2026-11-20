/**
 * Konfigurasi dan Standarisasi Periode (THBL) PDAM Tirtawening
 * Sinkron antara PC Kantor (Data Operasional Riil) dan PC Rumah (Development)
 */

export interface PeriodeOptionItem {
  value: string;
  label: string;
  status: 'BERJALAN' | 'TERKUNCI';
  isCurrent?: boolean;
}

export const PERIODE_BERJALAN_AKTIF = '202611'; // November 2026 (Live Catat Meter)
export const PERIODE_TERKUNCI_KANTOR = '202610'; // Oktober 2026 (Data Riil ProgresCater PW5)

/**
 * Daftar opsi periode standar untuk semua filter dropdown di dashboard,
 * monitoring lapangan, cek foto, anomali, dan laporan.
 */
export const STANDAR_PERIODE_OPTIONS: PeriodeOptionItem[] = [
  {
    value: '202611',
    label: 'November 2026 (202611) — Berjalan',
    status: 'BERJALAN',
    isCurrent: true,
  },
  {
    value: '202610',
    label: 'Oktober 2026 (202610) — Terkunci (Kantor)',
    status: 'TERKUNCI',
    isCurrent: false,
  },
];

/**
 * Konversi THBL 'YYYYMM' menjadi label human-readable dalam bahasa Indonesia.
 */
export function formatThblToLabel(thbl: string): string {
  if (!thbl || thbl.length !== 6) return thbl;
  const year = thbl.slice(0, 4);
  const monthNum = parseInt(thbl.slice(4, 6), 10);
  const bulanNama = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const bulan = bulanNama[monthNum - 1] || 'Bulan';
  return `${bulan} ${year}`;
}
