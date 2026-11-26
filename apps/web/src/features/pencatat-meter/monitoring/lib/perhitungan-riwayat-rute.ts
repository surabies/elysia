import type {
  ItemRuteBaca,
  RingkasanRuteData,
  SesiBacaRute,
  StatusSesi,
} from "../types/RiwayatPembacaanTypes";

/**
 * Memformat menit ke format jam & menit Indonesia ringkas (misal: "4j 30m" atau "45m")
 */
export function formatDurasiJamMenit(menit: number): string {
  if (menit <= 0) return "0m";
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  if (jam === 0) return `${sisaMenit}m`;
  return `${jam}j ${sisaMenit < 10 ? `0${sisaMenit}` : sisaMenit}m`;
}

/**
 * Menghitung persentase tuntas per rute:
 * Mendukung perhitungan riil berbasis target beban SL pelanggan:
 * Tuntas (%) = (total SL terbaca ÷ target beban) × 100%
 * Atau jika tidak ada target beban, rasio sesi tuntas terhadap sesi aktif.
 */
export function hitungTuntasRute(sesiList: SesiBacaRute[], targetBeban?: number): number {
  if (targetBeban && targetBeban > 0) {
    const totalTerbaca = sesiList.reduce((acc, s) => acc + (s.meterTerbaca || 0), 0);
    return Math.min(100, Number(((totalTerbaca / targetBeban) * 100).toFixed(1)));
  }

  const bukanDilewati = sesiList.filter(
    (s) => s.status !== "Dilewati" && s.status !== "Libur"
  );
  if (bukanDilewati.length === 0) return 0;
  const tuntasCount = bukanDilewati.filter(
    (s) => s.status === "Tuntas" || s.status === "Tercatat"
  ).length;
  return Number(((tuntasCount / bukanDilewati.length) * 100).toFixed(1));
}

/**
 * Menghitung persentil ke-95 durasi sesi
 */
export function hitungP95Durasi(durasiArr: number[]): number {
  if (durasiArr.length === 0) return 0;
  const sorted = [...durasiArr].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

/**
 * Menghitung deret terpanjang sesi berturut-turut yang bermasalah (bukan Tuntas/Tercatat/Libur)
 */
export function hitungRangkaianBermasalahTerpanjang(
  ruteList: ItemRuteBaca[]
): number {
  let maxStreak = 0;

  for (const rute of ruteList) {
    let currentStreak = 0;
    for (const sesi of rute.sesiList) {
      const isOk =
        sesi.status === "Tuntas" ||
        sesi.status === "Tercatat" ||
        sesi.status === "Dilewati" ||
        sesi.status === "Libur";

      if (!isOk) {
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
 * Menghitung tinggi pil yang dinormalisasi PER BARIS
 * terhadap CAPAIAN SL TERCATAT (bukan durasi fiktif server).
 * Pil merepresentasikan volume meter yang berhasil dibaca hari itu
 * relatif terhadap hari tertinggi petugas yang bersangkutan.
 */
export function hitungTinggiPilPerBaris(
  sesiList: SesiBacaRute[],
  minHeight = 6,
  maxHeight = 34
): number[] {
  if (sesiList.length === 0) return [];
  const maxVal = Math.max(...sesiList.map((s) => s.meterTerbaca || 0), 0);

  return sesiList.map((sesi) => {
    const val = sesi.meterTerbaca || 0;
    if (val <= 0 || sesi.status === "Libur" || sesi.status === "Dilewati") {
      return minHeight;
    }
    if (maxVal <= 0) return minHeight;
    const ratio = Math.min(1, Math.max(0, val / maxVal));
    const scaled = Math.round(minHeight + ratio * (maxHeight - minHeight));
    return Math.max(minHeight, Math.min(maxHeight, scaled));
  });
}

/**
 * Menghitung metrik operasional riil dan ringkasan riwayat rute:
 * 1. Total SL Tercatat & Capaian Kota
 * 2. Rata-rata Laju Harian (SL/hari kerja)
 * 3. Hari Kerja Aktif vs Libur
 * 4. Hari Puncak Lapangan
 */
export function hitungRingkasanRute(
  ruteList: ItemRuteBaca[]
): RingkasanRuteData {
  let totalSesi = 0;
  let totalTuntas = 0;
  let totalBermasalah = 0;
  let totalMeterTerbaca = 0;
  let targetKotaTotal = 0;
  let totalAnomaliSiklus = 0;
  let totalDurasiMenit = 0;
  let durasiCount = 0;

  let ruteBermasalahCount = 0;
  let tertinggiDurasi = 0;
  let ruteTerlamaNama = "";

  // Agregasi harian untuk mencari hari puncak kota & hari kerja aktif
  const harianMap = new Map<string, { totalSL: number; tanggal: string }>();

  // Hitung paruh untuk selisih tren (10 sesi awal vs 10 sesi akhir)
  let paruh1Tuntas = 0;
  let paruh1Total = 0;
  let paruh2Tuntas = 0;
  let paruh2Total = 0;

  const semuaDurasi: number[] = [];

  for (const rute of ruteList) {
    const sesi = rute.sesiList;
    totalSesi += sesi.length;
    targetKotaTotal += rute.jumlahPelanggan || 0;

    // Cek status sesi terakhir
    const sesiTerakhir = sesi[sesi.length - 1];
    if (
      sesiTerakhir &&
      sesiTerakhir.status !== "Tuntas" &&
      sesiTerakhir.status !== "Tercatat" &&
      sesiTerakhir.status !== "Libur" &&
      sesiTerakhir.status !== "Dilewati"
    ) {
      ruteBermasalahCount++;
    }

    const midIndex = Math.floor(sesi.length / 2);

    sesi.forEach((s, idx) => {
      const isAktif = s.status !== "Dilewati" && s.status !== "Libur";
      const isTuntas = s.status === "Tuntas" || s.status === "Tercatat";

      if (isAktif) {
        if (isTuntas) {
          totalTuntas++;
        } else {
          totalBermasalah++;
        }

        if (idx < midIndex) {
          paruh1Total++;
          if (isTuntas) paruh1Tuntas++;
        } else {
          paruh2Total++;
          if (isTuntas) paruh2Tuntas++;
        }
      }

      const sl = s.meterTerbaca || 0;
      totalMeterTerbaca += sl;
      totalAnomaliSiklus += s.anomaliCount || 0;

      if (sl > 0) {
        const cur = harianMap.get(s.tanggal) || { totalSL: 0, tanggal: s.tanggal };
        cur.totalSL += sl;
        harianMap.set(s.tanggal, cur);
      }

      if (s.durasiMenit > 0) {
        totalDurasiMenit += s.durasiMenit;
        durasiCount++;
        semuaDurasi.push(s.durasiMenit);

        if (s.durasiMenit > tertinggiDurasi) {
          tertinggiDurasi = s.durasiMenit;
          ruteTerlamaNama = rute.nama;
        }
      }
    });
  }

  // Hitung hari kerja aktif (tanggal dengan bacaan > 0)
  const hariKerjaAktif = harianMap.size;
  const totalHariSiklus = ruteList[0]?.sesiList.length ?? 20;

  // Cari hari puncak
  let puncakPembacaanSL = 0;
  let puncakTanggalTeks = "-";
  for (const h of harianMap.values()) {
    if (h.totalSL > puncakPembacaanSL) {
      puncakPembacaanSL = h.totalSL;
      puncakTanggalTeks = h.tanggal;
    }
  }

  // Rata-rata laju harian
  const rataRataLajuHarian =
    hariKerjaAktif > 0 ? Math.round(totalMeterTerbaca / hariKerjaAktif) : 0;

  // Capaian kota
  const finalTargetKota = targetKotaTotal > 0 ? targetKotaTotal : totalMeterTerbaca;
  const capaianKotaPersen =
    finalTargetKota > 0
      ? Number(((totalMeterTerbaca / finalTargetKota) * 100).toFixed(1))
      : 100;

  const bukanDilewatiTotal = totalTuntas + totalBermasalah;
  const sesiTuntasPersen =
    bukanDilewatiTotal > 0 ? (totalTuntas / bukanDilewatiTotal) * 100 : 0;

  // Selisih paruh kedua vs paruh pertama
  const p1Rate = paruh1Total > 0 ? (paruh1Tuntas / paruh1Total) * 100 : 100;
  const p2Rate = paruh2Total > 0 ? (paruh2Tuntas / paruh2Total) * 100 : 100;
  const selisihVsSebelumnyaPts = Number((p2Rate - p1Rate).toFixed(1));

  const rangkaianTerpanjangBermasalah =
    hitungRangkaianBermasalahTerpanjang(ruteList);

  const p95Durasi = hitungP95Durasi(semuaDurasi);
  const avgDurasi = durasiCount > 0 ? Math.round(totalDurasiMenit / durasiCount) : 0;

  return {
    // Metrik Operasional Riil
    totalMeterTerbaca,
    targetKotaTotal: finalTargetKota,
    capaianKotaPersen,
    rataRataLajuHarian,
    hariKerjaAktif,
    totalHariSiklus,
    puncakPembacaanSL,
    puncakTanggalTeks,
    totalPetugasAktif: ruteList.length,
    totalAnomaliSiklus,

    // Properti Kompatibilitas
    sesiTuntasPersen: Number(sesiTuntasPersen.toFixed(1)),
    selisihVsSebelumnyaPts,
    totalSesi,
    totalTuntas,
    totalBermasalah,
    ruteBermasalahCount,
    totalRuteCount: ruteList.length,
    rangkaianTerpanjangBermasalah,
    sesiTerlamaP95Teks: formatDurasiJamMenit(tertinggiDurasi || avgDurasi),
    sesiTerlamaRuteNama: ruteTerlamaNama || "Semua rute",
    durasiRataRataTeks: formatDurasiJamMenit(avgDurasi),
  };
}
