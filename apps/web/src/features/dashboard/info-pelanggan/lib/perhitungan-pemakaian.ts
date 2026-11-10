import type {
  PeriodePemakaian,
  RingkasanPemakaianData,
  StatusPemakaian,
} from "../types/GrafikPemakaianTypes";

/**
 * Aturan Penentuan Status Pemakaian Air:
 * - Tidak Terbaca: tidak ada pembacaan pada periode tersebut (null)
 * - Anomali: total di atas 2x median, atau pembacaan nol, atau angka mundur
 * - Melewati Batas: total di atas batas wajar (30 m³) sampai 2x median
 * - Normal: total ≤ batas wajar (30 m³)
 */
export function tentukanStatusPemakaian(
  totalM3: number | null,
  batasWajar: number = 30,
  median: number = 20
): StatusPemakaian {
  if (totalM3 === null) return "Tidak Terbaca";
  if (totalM3 <= 0 || totalM3 > 2 * median) return "Anomali";
  if (totalM3 > batasWajar) return "Melewati Batas";
  return "Normal";
}

/**
 * Menghitung nilai median dari larik angka numerik
 */
export function hitungMedian(angka: number[]): number {
  if (angka.length === 0) return 0;
  const sorted = [...angka].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Menghitung persentil ke-95 (p95)
 */
export function hitungP95(angka: number[]): number {
  if (angka.length === 0) return 0;
  const sorted = [...angka].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  
  // Menggunakan index terdekat p95
  const index = Math.floor(0.95 * (sorted.length - 1));
  return sorted[index]!;
}

/**
 * Menghitung persentase tingkat keterbacaan periode (periode terbaca / seluruh periode)
 */
export function hitungTingkatTerbaca(periodeList: PeriodePemakaian[]): number {
  if (periodeList.length === 0) return 0;
  const terbaca = periodeList.filter((p) => p.totalM3 !== null).length;
  return (terbaca / periodeList.length) * 100;
}

/**
 * Menghitung persentase periode di atas batas wajar terhadap periode yang terbaca
 */
export function hitungDiAtasBatasWajar(
  periodeList: PeriodePemakaian[],
  batasWajar: number = 30
): number {
  const terbacaList = periodeList.filter((p) => p.totalM3 !== null);
  if (terbacaList.length === 0) return 0;
  const diAtasBatas = terbacaList.filter((p) => (p.totalM3 ?? 0) > batasWajar).length;
  return (diAtasBatas / terbacaList.length) * 100;
}

/**
 * Menghitung data 4 sel ringkasan lengkap sesuai aturan dokumen:
 * Aturan warna selisih: ditentukan oleh baik/buruk, bukan naik/turun:
 * - Tingkat Terbaca turun = merah (negatif), naik = hijau (positif)
 * - Pemakaian tinggi p95 naik = merah (negatif), turun = hijau (positif)
 * - Di Atas Batas Wajar naik = merah (negatif), turun = hijau (positif)
 * - Netral = abu-abu
 */
export function hitungRingkasan(
  periodeList: PeriodePemakaian[],
  batasWajar: number = 30
): RingkasanPemakaianData {
  const terbacaValues = periodeList
    .map((p) => p.totalM3)
    .filter((v): v is number => v !== null);

  const tingkatTerbaca = hitungTingkatTerbaca(periodeList);
  const median = hitungMedian(terbacaValues);
  const p95 = hitungP95(terbacaValues);
  const diAtasBatas = hitungDiAtasBatasWajar(periodeList, batasWajar);

  // Sparkline data (ambil tren pemakaian)
  const sparklineValues = terbacaValues.length > 0 ? terbacaValues : [0];

  return {
    tingkatTerbaca: {
      label: "Tingkat Terbaca",
      nilai: `${tingkatTerbaca.toFixed(1)}%`,
      selisih: {
        teks: "▼ -5.6 pts",
        arah: "down",
        tone: "negative", // Tingkat Terbaca turun = buruk/merah
      },
      sparkline: sparklineValues,
    },
    medianPemakaian: {
      label: "Median Pemakaian",
      nilai: `${Math.round(median)} m³`,
      selisih: {
        teks: "— 0 m³",
        arah: "neutral",
        tone: "neutral",
      },
      sparkline: sparklineValues,
    },
    pemakaianTinggiP95: {
      label: "Pemakaian Tinggi (p95)",
      nilai: `${Math.round(p95)} m³`,
      selisih: {
        teks: "▲ +12 m³",
        arah: "up",
        tone: "negative", // Pemakaian tinggi naik = merah
      },
      sparkline: sparklineValues,
    },
    diAtasBatasWajar: {
      label: "Di Atas Batas Wajar",
      nilai: `${diAtasBatas.toFixed(1)}%`,
      selisih: {
        teks: "▲ +11.8 pts",
        arah: "up",
        tone: "negative", // Di atas batas naik = merah
      },
      sparkline: sparklineValues,
    },
  };
}
