import type {
  ItemRuteBaca,
  RingkasanRuteData,
  SesiBacaRute,
  StatusSesi,
} from "../types/RiwayatPembacaanTypes";

/**
 * Memformat menit ke format jam & menit Indonesia ringkas (misal: "7j 30m" atau "12m")
 */
export function formatDurasiJamMenit(menit: number): string {
  if (menit <= 0) return "0m";
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  if (jam === 0) return `${sisaMenit}m`;
  return `${jam}j ${sisaMenit < 10 ? `0${sisaMenit}` : sisaMenit}m`;
}

/**
 * Menghitung persentil ke-95 dari durasi sesi (dalam menit)
 */
export function hitungP95Durasi(durasiArr: number[]): number {
  if (durasiArr.length === 0) return 0;
  const sorted = [...durasiArr].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  const index = Math.floor(0.95 * (sorted.length - 1));
  return sorted[index]!;
}

/**
 * Menghitung persentase tuntas per rute:
 * Tuntas per rute = sesi Tuntas ÷ sesi yang tidak Dilewati
 */
export function hitungTuntasRute(sesiList: SesiBacaRute[]): number {
  const bukanDilewati = sesiList.filter((s) => s.status !== "Dilewati");
  if (bukanDilewati.length === 0) return 0;
  const tuntasCount = bukanDilewati.filter((s) => s.status === "Tuntas").length;
  return (tuntasCount / bukanDilewati.length) * 100;
}

/**
 * Menghitung deret terpanjang sesi berturut-turut yang bukan "Tuntas" di antara semua rute
 */
export function hitungRangkaianBermasalahTerpanjang(
  ruteList: ItemRuteBaca[]
): number {
  let maxStreak = 0;

  for (const rute of ruteList) {
    let currentStreak = 0;
    for (const sesi of rute.sesiList) {
      if (sesi.status !== "Tuntas" && sesi.status !== "Dilewati") {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }
  }

  return maxStreak;
}

/**
 * Menghitung tinggi pil yang dinormalisasi PER BARIS (bukan global)
 * terhadap durasi terpanjang di baris rute tersebut
 */
export function hitungTinggiPilPerBaris(
  sesiList: SesiBacaRute[],
  minHeight = 6,
  maxHeight = 36
): number[] {
  if (sesiList.length === 0) return [];
  const maxDurasi = Math.max(...sesiList.map((s) => s.durasiMenit), 1);

  return sesiList.map((sesi) => {
    if (sesi.status === "Dilewati") return minHeight;
    // Sesi gagal berhenti cepat, diberi minHeight agar tetap terlihat sebagai titik
    if (sesi.status === "Gagal") {
      const scaled = (sesi.durasiMenit / maxDurasi) * maxHeight;
      return Math.max(minHeight, Math.round(scaled));
    }
    const ratio = sesi.durasiMenit / maxDurasi;
    return Math.max(minHeight, Math.round(ratio * maxHeight));
  });
}

/**
 * Menghitung seluruh angka ringkasan kartu:
 * - Sesi Tuntas: total tuntas ÷ total bukan dilewati (153 / 160 = 95.6%)
 * - Selisih vs sesi sebelumnya: tuntas 10 sesi terbaru - tuntas 10 sesi sebelumnya (-8.8 pts)
 * - Total Sesi: 160 (7 bermasalah)
 * - Rute Bermasalah: rute yang sesi terakhirnya bukan Tuntas (1 dari 8)
 * - Rangkaian terpanjang: 5 sesi
 * - Sesi Terlama: p95 tertinggi antar rute ("7j 30m" pada "Rute 01 Coblong")
 */
export function hitungRingkasanRute(
  ruteList: ItemRuteBaca[]
): RingkasanRuteData {
  let totalSesi = 0;
  let totalTuntas = 0;
  let totalBermasalah = 0;

  let total10TerbaruBukanDilewati = 0;
  let tuntas10Terbaru = 0;
  let total10SebelumnyaBukanDilewati = 0;
  let tuntas10Sebelumnya = 0;

  let ruteBermasalahCount = 0;

  let tertinggiP95Durasi = 0;
  let ruteP95TerlamaNama = "";

  for (const rute of ruteList) {
    const sesi = rute.sesiList;
    totalSesi += sesi.length;

    // Sesi terakhir
    const sesiTerakhir = sesi[sesi.length - 1];
    if (sesiTerakhir && sesiTerakhir.status !== "Tuntas") {
      ruteBermasalahCount++;
    }

    // p95 rute ini
    const durasiList = sesi.map((s) => s.durasiMenit);
    const p95Rute = hitungP95Durasi(durasiList);
    if (p95Rute > tertinggiP95Durasi) {
      tertinggiP95Durasi = p95Rute;
      ruteP95TerlamaNama = rute.nama;
    }

    // Hitung tuntas & bermasalah
    for (let i = 0; i < sesi.length; i++) {
      const s = sesi[i]!;
      if (s.status !== "Dilewati") {
        if (s.status === "Tuntas") {
          totalTuntas++;
        } else {
          totalBermasalah++;
        }

        // 10 sesi sebelumnya (index 0 - 9) vs 10 sesi terbaru (index 10 - 19)
        if (i < 10) {
          total10SebelumnyaBukanDilewati++;
          if (s.status === "Tuntas") tuntas10Sebelumnya++;
        } else {
          total10TerbaruBukanDilewati++;
          if (s.status === "Tuntas") tuntas10Terbaru++;
        }
      }
    }
  }

  const bukanDilewatiTotal = totalTuntas + totalBermasalah;
  const sesiTuntasPersen =
    bukanDilewatiTotal > 0 ? (totalTuntas / bukanDilewatiTotal) * 100 : 0;

  const rateTerbaru =
    total10TerbaruBukanDilewati > 0
      ? (tuntas10Terbaru / total10TerbaruBukanDilewati) * 100
      : 0;
  const rateSebelumnya =
    total10SebelumnyaBukanDilewati > 0
      ? (tuntas10Sebelumnya / total10SebelumnyaBukanDilewati) * 100
      : 0;
  const selisihVsSebelumnyaPts = rateTerbaru - rateSebelumnya;

  const rangkaianTerpanjangBermasalah =
    hitungRangkaianBermasalahTerpanjang(ruteList);

  return {
    sesiTuntasPersen: Number(sesiTuntasPersen.toFixed(1)),
    selisihVsSebelumnyaPts: Number(selisihVsSebelumnyaPts.toFixed(1)),
    totalSesi,
    totalTuntas,
    totalBermasalah,
    ruteBermasalahCount,
    totalRuteCount: ruteList.length,
    rangkaianTerpanjangBermasalah,
    sesiTerlamaP95Teks: formatDurasiJamMenit(tertinggiP95Durasi),
    sesiTerlamaRuteNama: ruteP95TerlamaNama,
  };
}
