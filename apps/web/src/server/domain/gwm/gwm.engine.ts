/**
 * Domain Engine: Logika Ganti Water Meter (GWM Mutasi) & Neraca Air Grand Water Meter (NRW)
 * 100% Pure Business Logic (Bebas dari I/O, Database, dan Framework HTTP)
 */

export interface HitungGantiMeterInput {
  standLalu: number;       // Stand pembacaan resmi bulan lalu
  standAngkat: number;     // Angka stand meter lama saat dicabut
  standPasang: number;     // Angka stand meter baru saat dipasang (biasanya 0)
  standBacaBaru: number;   // Angka stand pembacaan cater pada meter baru bulan ini
}

export interface HasilHitungGantiMeter {
  pakaiMeterLama: number;  // standAngkat - standLalu
  pakaiMeterBaru: number;  // standBacaBaru - standPasang
  totalPemakaianM3: number;// pakaiMeterLama + pakaiMeterBaru
  isValid: boolean;
  pesanError?: string;
}

/**
 * Menghitung pemakaian air dalam periode di mana terjadi pergantian meter
 * Rumus Baku: (Stand Angkat - Stand Lalu) + (Stand Baca Baru - Stand Pasang)
 */
export function hitungKubikasiGantiMeter(input: HitungGantiMeterInput): HasilHitungGantiMeter {
  const { standLalu, standAngkat, standPasang, standBacaBaru } = input;

  const pakaiMeterLama = standAngkat - standLalu;
  const pakaiMeterBaru = standBacaBaru - standPasang;

  if (pakaiMeterLama < 0) {
    return {
      pakaiMeterLama,
      pakaiMeterBaru,
      totalPemakaianM3: 0,
      isValid: false,
      pesanError: `Stand angkat (${standAngkat}) lebih kecil dari stand lalu (${standLalu}). Periksa kembali angka meter lama yang dicabut.`,
    };
  }

  if (pakaiMeterBaru < 0) {
    return {
      pakaiMeterLama,
      pakaiMeterBaru,
      totalPemakaianM3: 0,
      isValid: false,
      pesanError: `Stand baca meter baru (${standBacaBaru}) lebih kecil dari stand pasang awal (${standPasang}). Periksa kembali angka meter baru.`,
    };
  }

  return {
    pakaiMeterLama,
    pakaiMeterBaru,
    totalPemakaianM3: pakaiMeterLama + pakaiMeterBaru,
    isValid: true,
  };
}

export interface NeracaAirInput {
  totalDebitGwmM3: number;            // Total volume air masuk dari Grand Water Meter induk DMA
  totalPemakaianPelangganM3: number;  // Akumulasi pemakaian seluruh meter pelanggan di zona
}

export interface HasilNeracaAir {
  totalDebitGwmM3: number;
  totalPemakaianPelangganM3: number;
  kehilanganAirM3: number;            // Non-Revenue Water dalam volume m3
  persentaseNrw: number;              // Persentase kebocoran air (%)
  statusTingkatKebocoran: 'AMAN' | 'WASPADA' | 'KRITIS';
  rekomendasi: string;
}

/**
 * Menghitung Neraca Air (Water Balance) dan tingkat kebocoran pipa (NRW) suatu zona
 * @param input Debit GWM induk dan akumulasi kubikasi pelanggan
 */
export function hitungNeracaAir(input: NeracaAirInput): HasilNeracaAir {
  const { totalDebitGwmM3, totalPemakaianPelangganM3 } = input;

  if (totalDebitGwmM3 <= 0) {
    return {
      totalDebitGwmM3: 0,
      totalPemakaianPelangganM3,
      kehilanganAirM3: 0,
      persentaseNrw: 0,
      statusTingkatKebocoran: 'AMAN',
      rekomendasi: 'Debit air masuk GWM bernilai 0 atau belum dicatat.',
    };
  }

  const kehilanganAirM3 = Math.max(0, totalDebitGwmM3 - totalPemakaianPelangganM3);
  const persentaseNrw = Number(((kehilanganAirM3 / totalDebitGwmM3) * 100).toFixed(2));

  let statusTingkatKebocoran: HasilNeracaAir['statusTingkatKebocoran'];
  let rekomendasi: string;

  if (persentaseNrw <= 15) {
    statusTingkatKebocoran = 'AMAN';
    rekomendasi = 'Tingkat kehilangan air dalam batas standar efisiensi jaringan perpipaan (< 15%).';
  } else if (persentaseNrw <= 25) {
    statusTingkatKebocoran = 'WASPADA';
    rekomendasi = 'Tingkat kehilangan air di atas toleransi (15%-25%). Diperlukan survei kebocoran akustik pipa.';
  } else {
    statusTingkatKebocoran = 'KRITIS';
    rekomendasi = 'Tingkat kehilangan air sangat tinggi (> 25%). Indikasi kebocoran pipa distribusi utama atau sambungan ilegal.';
  }

  return {
    totalDebitGwmM3,
    totalPemakaianPelangganM3,
    kehilanganAirM3,
    persentaseNrw,
    statusTingkatKebocoran,
    rekomendasi,
  };
}
