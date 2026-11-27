/**
 * Domain Engine: Logika Ganti Water Meter (GWM Mutasi) & Neraca Air Grand Water Meter (NRW)
 * 100% Pure Business Logic (Bebas dari I/O, Database, dan Framework HTTP)
 */

export interface HitungGantiMeterInput {
  standLalu: number;               // Stand pembacaan resmi bulan lalu
  standAngkat?: number | null;     // Angka stand meter lama saat dicabut (opsional bila override tanpaStandAngkat = true)
  standPasang?: number;            // Angka stand meter baru saat dipasang (default 0)
  standBacaBaru: number;           // Angka stand pembacaan cater pada meter baru bulan ini
  tanpaStandAngkat?: boolean;      // Override sadar manusia bila stand angkat tidak tercatat / meter lama rusak
}

export interface HasilHitungGantiMeter {
  pakaiMeterLama: number;          // standAngkat - standLalu (0 bila override tanpaStandAngkat)
  pakaiMeterBaru: number;          // standBacaBaru - standPasang
  totalPemakaianM3: number;        // pakaiMeterLama + pakaiMeterBaru
  isValid: boolean;
  isOverrideTanpaStandAngkat: boolean;
  butuhKonfirmasiManusia?: boolean;
  pesanError?: string;
}

/**
 * Menghitung pemakaian air dalam periode di mana terjadi pergantian meter
 * Rumus Baku: (Stand Angkat - Stand Lalu) + (Stand Baca Baru - Stand Pasang)
 * Mendukung Override Manusia Eksplisit (`tanpaStandAngkat = true`) ketika petugas lalai / meter lama rusak.
 */
export function hitungKubikasiGantiMeter(input: HitungGantiMeterInput): HasilHitungGantiMeter {
  const {
    standLalu,
    standAngkat = null,
    standPasang = 0,
    standBacaBaru,
    tanpaStandAngkat = false,
  } = input;

  const awalBaru = standPasang >= 0 ? standPasang : 0;
  const pakaiMeterBaru = standBacaBaru - awalBaru;

  if (pakaiMeterBaru < 0) {
    return {
      pakaiMeterLama: 0,
      pakaiMeterBaru,
      totalPemakaianM3: 0,
      isValid: false,
      isOverrideTanpaStandAngkat: false,
      pesanError: `Stand baca meter baru (${standBacaBaru}) lebih kecil dari stand pasang awal (${awalBaru}). Periksa kembali angka meter baru.`,
    };
  }

  // Mode Human Override: Operator secara sadar mengesahkan tanpa Stand Angkat meter lama
  if (tanpaStandAngkat && (standAngkat === null || standAngkat === undefined)) {
    return {
      pakaiMeterLama: 0,
      pakaiMeterBaru,
      totalPemakaianM3: pakaiMeterBaru,
      isValid: true,
      isOverrideTanpaStandAngkat: true,
    };
  }

  // Mode Ketat (Default): Stand Angkat wajib ada dan >= Stand Lalu
  if (standAngkat === null || standAngkat === undefined) {
    return {
      pakaiMeterLama: 0,
      pakaiMeterBaru,
      totalPemakaianM3: 0,
      isValid: false,
      isOverrideTanpaStandAngkat: false,
      butuhKonfirmasiManusia: true,
      pesanError:
        'Stand angkat meter lama belum diisi. Masukkan Stand Angkat atau aktifkan Override Tanpa Stand Angkat.',
    };
  }

  const pakaiMeterLama = standAngkat - standLalu;
  if (pakaiMeterLama < 0) {
    return {
      pakaiMeterLama,
      pakaiMeterBaru,
      totalPemakaianM3: 0,
      isValid: false,
      isOverrideTanpaStandAngkat: false,
      pesanError: `Stand angkat (${standAngkat}) lebih kecil dari stand lalu (${standLalu}). Periksa kembali angka meter lama atau gunakan Override Tanpa Stand Angkat bila meter lama rusak/mundur.`,
    };
  }

  return {
    pakaiMeterLama,
    pakaiMeterBaru,
    totalPemakaianM3: pakaiMeterLama + pakaiMeterBaru,
    isValid: true,
    isOverrideTanpaStandAngkat: false,
  };
}

// ============================================================================
// ENGINE ROLLOVER (U | MUDA KEMBALI) BERBASIS SNI 2547 / ISO 4064 & PROXIMITY
// ============================================================================

export type DigitRegisterMeter = 4 | 5 | 6 | 7;

export interface InferDigitRolloverInput {
  standAwal: number;
  standAkhir: number;
  ukuranMeter?: string | null;
  jumlahDigitAset?: number | null;
  digitOverride?: number | null;
}

export interface HasilInferDigitRollover {
  digit: DigitRegisterMeter;
  batasPutar: number;              // 10^digit (10.000, 100.000, 1.000.000, 10.000.000)
  isNearRolloverZone: boolean;     // true bila standAwal >= 85% dari batasPutar
  sumberDigit: 'OVERRIDE_OPERATOR' | 'ASET_METER' | 'PROXIMITY_STAND' | 'UKURAN_PIPA';
}

/**
 * Standar default jumlah digit angka hitam (m3) berdasarkan ukuran pipa meter (SNI 2547 / ISO 4064):
 * - 1/2" & 3/4" -> 4 digit (10.000)
 * - 1" & 1 1/2" -> 5 digit (100.000)
 * - >= 2"       -> 6 digit (1.000.000)
 */
export function defaultDigitDariUkuranMeter(ukuranMeter?: string | null): DigitRegisterMeter {
  const norm = (ukuranMeter ?? '').trim().toLowerCase();
  if (!norm || norm === '1/2' || norm === '0.5' || norm === '3/4' || norm === '0.75') {
    return 4;
  }
  if (norm === '1' || norm === '1 1/2' || norm === '1.5' || norm === '1,5') {
    return 5;
  }
  return 6;
}

function clampDigitValid(d: number): DigitRegisterMeter {
  if (d <= 4) return 4;
  if (d === 5) return 5;
  if (d === 6) return 6;
  return 7;
}

export function digitMinimumDariStand(standAwal: number, standAkhir: number): DigitRegisterMeter {
  const maxVal = Math.max(0, Math.floor(standAwal), Math.floor(standAkhir));
  const len = String(maxVal).length;
  return clampDigitValid(Math.max(4, len));
}

/**
 * Menentukan jumlah digit & batas putar (10^D) paling presisi untuk Muda Kembali (Rollover):
 * 1. Override eksplisit operator (bila kapasitas mencukupi standAwal & standAkhir).
 * 2. Atribut `jumlahDigit` pada aset water_meter (bila tercatat & mencukupi).
 * 3. Smart Proximity Inference: Jika standAwal >= 85% dari 10^(digitMin) dan standAkhir < standAwal
 *    (misal 9.998->10 pada 4-digit, atau 99.980->45 pada meter 2" 5-digit), gunakan digitMin agar
 *    tidak meleset ke 1.000.000!
 * 4. Fallback ke max(digitMin, defaultDigitDariUkuranMeter).
 */
export function inferDigitMeterRollover(input: InferDigitRolloverInput): HasilInferDigitRollover {
  const { standAwal, standAkhir, ukuranMeter, jumlahDigitAset, digitOverride } = input;
  const digitMin = digitMinimumDariStand(standAwal, standAkhir);

  if (digitOverride != null && Number.isInteger(digitOverride) && digitOverride >= 4 && digitOverride <= 7) {
    const d = clampDigitValid(digitOverride);
    if (10 ** d > standAwal && 10 ** d > standAkhir) {
      const batasPutar = 10 ** d;
      return {
        digit: d,
        batasPutar,
        isNearRolloverZone: standAwal >= batasPutar * 0.85,
        sumberDigit: 'OVERRIDE_OPERATOR',
      };
    }
  }

  if (jumlahDigitAset != null && Number.isInteger(jumlahDigitAset) && jumlahDigitAset >= 4 && jumlahDigitAset <= 7) {
    const d = clampDigitValid(Math.max(digitMin, jumlahDigitAset));
    const batasPutar = 10 ** d;
    return {
      digit: d,
      batasPutar,
      isNearRolloverZone: standAwal >= batasPutar * 0.85,
      sumberDigit: 'ASET_METER',
    };
  }

  const batasMin = 10 ** digitMin;
  if (standAkhir < standAwal && standAwal >= batasMin * 0.85) {
    return {
      digit: digitMin,
      batasPutar: batasMin,
      isNearRolloverZone: true,
      sumberDigit: 'PROXIMITY_STAND',
    };
  }

  const digitUkuran = clampDigitValid(Math.max(digitMin, defaultDigitDariUkuranMeter(ukuranMeter)));
  const batasUkuran = 10 ** digitUkuran;
  return {
    digit: digitUkuran,
    batasPutar: batasUkuran,
    isNearRolloverZone: standAwal >= batasUkuran * 0.85,
    sumberDigit: 'UKURAN_PIPA',
  };
}

export interface HitungMudaKembaliInput {
  standAwal: number;
  standAkhir: number;
  ukuranMeter?: string | null;
  jumlahDigitAset?: number | null;
  digitOverride?: number | null;
}

export interface HasilHitungMudaKembali {
  digit: DigitRegisterMeter;
  batasPutar: number;              // 10^digit (mis. 10.000)
  sisaPutaranLama: number;         // batasPutar - standAwal (0 bila belum berputar / standAkhir >= standAwal)
  jalanPutaranBaru: number;        // standAkhir (selisih biasa bila standAkhir >= standAwal)
  totalPemakaianM3: number;        // (batasPutar - standAwal) + standAkhir
  isRolloverTerjadi: boolean;      // true bila standAkhir < standAwal
  isNearRolloverZone: boolean;     // false bila standAwal masih jauh dari 999..9 (indikasi salah pilih kondisi, seharusnya MB)
  isValid: boolean;
  peringatanPlausibilitas?: string;
  pesanError?: string;
}

/**
 * Menghitung pemakaian air pada kondisi U | MUDA KEMBALI (Dial Rollover):
 * - Jika standAkhir < standAwal: Rumus = (10^D - standAwal) + standAkhir
 *   Contoh: digit = 4 (10.000), standAwal = 9.998, standAkhir = 10 -> (10.000 - 9.998) + 10 = 2 + 10 = 12 m³.
 * - Jika standAkhir >= standAwal: Meter belum melewati titik nol pada siklus ini -> standAkhir - standAwal.
 */
export function hitungKubikasiMudaKembali(input: HitungMudaKembaliInput): HasilHitungMudaKembali {
  const { standAwal, standAkhir, ukuranMeter, jumlahDigitAset, digitOverride } = input;

  if (standAwal < 0 || standAkhir < 0) {
    return {
      digit: 4,
      batasPutar: 10000,
      sisaPutaranLama: 0,
      jalanPutaranBaru: 0,
      totalPemakaianM3: 0,
      isRolloverTerjadi: false,
      isNearRolloverZone: false,
      isValid: false,
      pesanError: 'Stand awal dan stand akhir tidak boleh bernilai negatif.',
    };
  }

  // Validasi jika operator memaksa memilih digitOverride yang lebih kecil dari stand aktual
  if (digitOverride != null && (10 ** digitOverride <= standAwal || 10 ** digitOverride <= standAkhir)) {
    return {
      digit: clampDigitValid(digitOverride),
      batasPutar: 10 ** digitOverride,
      sisaPutaranLama: 0,
      jalanPutaranBaru: 0,
      totalPemakaianM3: 0,
      isRolloverTerjadi: false,
      isNearRolloverZone: false,
      isValid: false,
      pesanError: `Kapasitas ${digitOverride} digit (maks ${(10 ** digitOverride - 1).toLocaleString('id-ID')}) tidak mencukupi angka stand (${Math.max(standAwal, standAkhir).toLocaleString('id-ID')}). Pilih kapasitas digit yang lebih besar.`,
    };
  }

  const info = inferDigitMeterRollover({
    standAwal,
    standAkhir,
    ukuranMeter,
    jumlahDigitAset,
    digitOverride,
  });

  if (standAkhir >= standAwal) {
    const selisihBiasa = standAkhir - standAwal;
    return {
      digit: info.digit,
      batasPutar: info.batasPutar,
      sisaPutaranLama: 0,
      jalanPutaranBaru: selisihBiasa,
      totalPemakaianM3: selisihBiasa,
      isRolloverTerjadi: false,
      isNearRolloverZone: true,
      isValid: true,
    };
  }

  const sisaPutaranLama = info.batasPutar - standAwal;
  const jalanPutaranBaru = standAkhir;
  const totalPemakaianM3 = sisaPutaranLama + jalanPutaranBaru;

  const peringatanPlausibilitas = !info.isNearRolloverZone
    ? `Stand awal (${standAwal.toLocaleString('id-ID')}) masih jauh dari batas penuh ${(info.batasPutar - 1).toLocaleString('id-ID')}, menghasilkan pemakaian sangat besar (${totalPemakaianM3.toLocaleString('id-ID')} m³). Pastikan ini benar Muda Kembali dan bukan pergantian Meter Baru (MB).`
    : undefined;

  return {
    digit: info.digit,
    batasPutar: info.batasPutar,
    sisaPutaranLama,
    jalanPutaranBaru,
    totalPemakaianM3,
    isRolloverTerjadi: true,
    isNearRolloverZone: info.isNearRolloverZone,
    isValid: true,
    peringatanPlausibilitas,
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

export interface HitungKoreksiMbSusulanInput {
  standLalu: number;            // stml bulan kejadian
  standAngkat: number;          // baru diketahui setelah periode closed
  standPasang: number;
  standBacaBaru: number;        // stma meter baru bulan kejadian
  pemakaianMinimumM3: number;
  pakaiTagihTerbit: number;     // yang sudah terbit di DRD bulan kejadian
}

export interface HasilKoreksiMbSusulan {
  pemakaianGabunganM3: number;
  pakaiTagihSeharusnya: number;
  pakaiTagihTerbit: number;
  selisihM3: number;            // >0 tagihan susulan, <0 kelebihan tagih (kredit), 0 tidak ada koreksi
  isValid: boolean;
  pesanError?: string;
}

/**
 * Koreksi MB yang datanya (stand angkat) baru diketahui SETELAH periode closed.
 * Dihitung atas BULAN KEJADIAN: seharusnya (pemakaian gabungan, dengan minimum) - yang sudah terbit.
 * TIDAK PERNAH ditambahkan ke pemakaian bulan berikutnya.
 */
export function hitungKoreksiMbSusulan(input: HitungKoreksiMbSusulanInput): HasilKoreksiMbSusulan {
  const gabungan = hitungKubikasiGantiMeter({
    standLalu: input.standLalu,
    standAngkat: input.standAngkat,
    standPasang: input.standPasang,
    standBacaBaru: input.standBacaBaru,
  });
  if (!gabungan.isValid) {
    return {
      pemakaianGabunganM3: 0,
      pakaiTagihSeharusnya: 0,
      pakaiTagihTerbit: input.pakaiTagihTerbit,
      selisihM3: 0,
      isValid: false,
      pesanError: gabungan.pesanError,
    };
  }
  const seharusnya =
    input.pemakaianMinimumM3 > 0 && gabungan.totalPemakaianM3 < input.pemakaianMinimumM3
      ? input.pemakaianMinimumM3
      : gabungan.totalPemakaianM3;
  return {
    pemakaianGabunganM3: gabungan.totalPemakaianM3,
    pakaiTagihSeharusnya: seharusnya,
    pakaiTagihTerbit: input.pakaiTagihTerbit,
    selisihM3: seharusnya - input.pakaiTagihTerbit,
    isValid: true,
  };
}
