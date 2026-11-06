/**
 * Domain Engine: Perhitungan Pemakaian & Deteksi Anomali Baca Meter
 * Pure Business Logic: Bebas dari I/O, Database, dan HTTP.
 */

export interface EvaluasiPemakaianInput {
  stml: number;
  stma: number;
  pakaiLalu?: number | null;
}

export interface EvaluasiPemakaianResult {
  pakaiM3: number;
  isAnomali: boolean;
  statusVerifikasi: 'SUBMITTED' | 'ANOMALY_NEGATIVE' | 'ANOMALY_HIGH' | 'ANOMALY_LOW';
  kategoriAnomali?: string;
  pesan?: string;
}

/**
 * Menghitung selisih angka stand meter dan mengevaluasi indikasi anomali
 * @param input stml (lalu), stma (akhir), dan riwayat pemakaian lalu
 */
export function evaluasiPemakaianMeter(input: EvaluasiPemakaianInput): EvaluasiPemakaianResult {
  const { stml, stma, pakaiLalu } = input;
  const pakaiM3 = stma - stml;

  // 1. Kasus Meter Mundur / Negatif (Stand Akhir < Stand Lalu)
  if (pakaiM3 < 0) {
    return {
      pakaiM3,
      isAnomali: true,
      statusVerifikasi: 'ANOMALY_NEGATIVE',
      kategoriAnomali: 'METER_MUNDUR_ATAU_TERBALIK',
      pesan: 'Stand akhir lebih kecil dari stand lalu. Diperlukan pengecekan rollover (9999->0000) atau meter terbalik.',
    };
  }

  // 2. Kasus Lonjakan Ekstrim (> 100 m³ atau > 300% dari pemakaian lalu)
  if (pakaiM3 > 100 || (pakaiLalu !== undefined && pakaiLalu !== null && pakaiLalu > 0 && pakaiM3 >= pakaiLalu * 3)) {
    return {
      pakaiM3,
      isAnomali: true,
      statusVerifikasi: 'ANOMALY_HIGH',
      kategoriAnomali: 'PEMAKAIAN_LONJAKAN_TINGGI',
      pesan: `Pemakaian (${pakaiM3} m³) terdeteksi melonjak tinggi dibanding pemakaian normal.`,
    };
  }

  // 3. Kasus Pemakaian 0 m³ berturut-turut
  if (pakaiM3 === 0 && pakaiLalu !== undefined && pakaiLalu !== null && pakaiLalu === 0) {
    return {
      pakaiM3,
      isAnomali: true,
      statusVerifikasi: 'ANOMALY_LOW',
      kategoriAnomali: 'PEMAKAIAN_NOL_BERULANG',
      pesan: 'Pemakaian 0 m³ berulang. Perlu verifikasi rumah kosong atau meter macet.',
    };
  }

  // 4. Pembacaan Normal
  return {
    pakaiM3,
    isAnomali: false,
    statusVerifikasi: 'SUBMITTED',
  };
}
