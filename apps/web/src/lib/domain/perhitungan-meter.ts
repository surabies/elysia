export type DigitRegisterMeter = 4 | 5 | 6 | 7

export function hitungPemakaianGantiMeter({
  standAwalLama,
  standAngkatLama,
  standMeterBaru,
  standPasang = 0,
  tanpaStandAngkat = false,
}: {
  standAwalLama: number
  standAngkatLama?: number | null
  standMeterBaru: number
  standPasang?: number
  tanpaStandAngkat?: boolean
}): number {
  const awalBaru = standPasang >= 0 ? standPasang : 0
  const pemakaianMeterBaru = standMeterBaru - awalBaru
  if (tanpaStandAngkat && (standAngkatLama === null || standAngkatLama === undefined)) {
    return pemakaianMeterBaru
  }
  if (standAngkatLama === null || standAngkatLama === undefined) {
    return standMeterBaru - standAwalLama
  }
  const pemakaianMeterLama = standAngkatLama - standAwalLama
  return pemakaianMeterLama + pemakaianMeterBaru
}

export function defaultDigitDariUkuranMeter(ukuranMeter?: string | null): DigitRegisterMeter {
  const norm = (ukuranMeter ?? "").trim().toLowerCase()
  if (!norm || norm === "1/2" || norm === "0.5" || norm === "3/4" || norm === "0.75") {
    return 4
  }
  if (norm === "1" || norm === "1 1/2" || norm === "1.5" || norm === "1,5") {
    return 5
  }
  return 6
}

function clampDigitValid(d: number): DigitRegisterMeter {
  if (d <= 4) return 4
  if (d === 5) return 5
  if (d === 6) return 6
  return 7
}

export function inferDigitMeterRollover({
  standAwal,
  standAkhir,
  ukuranMeter,
  jumlahDigitAset,
  digitOverride,
}: {
  standAwal: number
  standAkhir: number
  ukuranMeter?: string | null
  jumlahDigitAset?: number | null
  digitOverride?: number | null
}): {
  digit: DigitRegisterMeter
  batasPutar: number
  isNearRolloverZone: boolean
} {
  const maxVal = Math.max(0, Math.floor(standAwal), Math.floor(standAkhir))
  const digitMin = clampDigitValid(Math.max(4, String(maxVal).length))

  if (
    digitOverride != null &&
    Number.isInteger(digitOverride) &&
    digitOverride >= 4 &&
    digitOverride <= 7 &&
    10 ** digitOverride > standAwal &&
    10 ** digitOverride > standAkhir
  ) {
    const d = clampDigitValid(digitOverride)
    const batasPutar = 10 ** d
    return {
      digit: d,
      batasPutar,
      isNearRolloverZone: standAwal >= batasPutar * 0.85,
    }
  }

  if (
    jumlahDigitAset != null &&
    Number.isInteger(jumlahDigitAset) &&
    jumlahDigitAset >= 4 &&
    jumlahDigitAset <= 7
  ) {
    const d = clampDigitValid(Math.max(digitMin, jumlahDigitAset))
    const batasPutar = 10 ** d
    return {
      digit: d,
      batasPutar,
      isNearRolloverZone: standAwal >= batasPutar * 0.85,
    }
  }

  const batasMin = 10 ** digitMin
  if (standAkhir < standAwal && standAwal >= batasMin * 0.85) {
    return {
      digit: digitMin,
      batasPutar: batasMin,
      isNearRolloverZone: true,
    }
  }

  const digitUkuran = clampDigitValid(
    Math.max(digitMin, defaultDigitDariUkuranMeter(ukuranMeter)),
  )
  const batasUkuran = 10 ** digitUkuran
  return {
    digit: digitUkuran,
    batasPutar: batasUkuran,
    isNearRolloverZone: standAwal >= batasUkuran * 0.85,
  }
}

export function hitungPemakaianMudaKembali({
  standAwal,
  standAkhir,
  ukuranMeter,
  jumlahDigitAset,
  digitOverride,
}: {
  standAwal: number
  standAkhir: number
  ukuranMeter?: string | null
  jumlahDigitAset?: number | null
  digitOverride?: number | null
}): {
  digit: DigitRegisterMeter
  batasPutar: number
  sisaPutaranLama: number
  jalanPutaranBaru: number
  totalPemakaianM3: number
  isRolloverTerjadi: boolean
  isNearRolloverZone: boolean
  isValid: boolean
  peringatanPlausibilitas?: string
  pesanError?: string
} {
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
      pesanError: "Stand tidak boleh negatif.",
    }
  }

  if (
    digitOverride != null &&
    (10 ** digitOverride <= standAwal || 10 ** digitOverride <= standAkhir)
  ) {
    return {
      digit: clampDigitValid(digitOverride),
      batasPutar: 10 ** digitOverride,
      sisaPutaranLama: 0,
      jalanPutaranBaru: 0,
      totalPemakaianM3: 0,
      isRolloverTerjadi: false,
      isNearRolloverZone: false,
      isValid: false,
      pesanError: `Kapasitas ${digitOverride} digit (maks ${(10 ** digitOverride - 1).toLocaleString("id-ID")}) tidak mencukupi stand (${Math.max(standAwal, standAkhir).toLocaleString("id-ID")}).`,
    }
  }

  const info = inferDigitMeterRollover({
    standAwal,
    standAkhir,
    ukuranMeter,
    jumlahDigitAset,
    digitOverride,
  })

  if (standAkhir >= standAwal) {
    const selisih = standAkhir - standAwal
    return {
      digit: info.digit,
      batasPutar: info.batasPutar,
      sisaPutaranLama: 0,
      jalanPutaranBaru: selisih,
      totalPemakaianM3: selisih,
      isRolloverTerjadi: false,
      isNearRolloverZone: true,
      isValid: true,
    }
  }

  const sisaPutaranLama = info.batasPutar - standAwal
  const jalanPutaranBaru = standAkhir
  const totalPemakaianM3 = sisaPutaranLama + jalanPutaranBaru

  return {
    digit: info.digit,
    batasPutar: info.batasPutar,
    sisaPutaranLama,
    jalanPutaranBaru,
    totalPemakaianM3,
    isRolloverTerjadi: true,
    isNearRolloverZone: info.isNearRolloverZone,
    isValid: true,
    peringatanPlausibilitas: !info.isNearRolloverZone
      ? `Stand awal (${standAwal.toLocaleString("id-ID")}) masih jauh dari batas penuh ${(info.batasPutar - 1).toLocaleString("id-ID")} (menghasilkan ${totalPemakaianM3.toLocaleString("id-ID")} m³). Pastikan ini benar Muda Kembali dan bukan Meter Baru (MB).`
      : undefined,
  }
}
