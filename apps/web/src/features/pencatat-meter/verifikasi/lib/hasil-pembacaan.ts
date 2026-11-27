import {
  hitungPemakaianGantiMeter,
  hitungPemakaianMudaKembali,
} from "@/lib/domain/perhitungan-meter"
import type { BarisVerifikasi } from "../types"

type DataPembacaan = Pick<
  BarisVerifikasi,
  | "standAwal"
  | "standAwalRevisi"
  | "standAkhir"
  | "standAkhirRevisi"
  | "pemakaian"
  | "pemakaianRevisi"
  | "kondisi"
  | "kondisiRevisi"
  | "standAngkatLama"
  | "standMeterBaru"
  | "standPasang"
  | "mbTanpaStandAngkat"
  | "digitRollover"
  | "ukuranMeter"
  | "jumlahDigitAset"
  | "pembacaan"
>

export function tentukanHasilPembacaan(row: DataPembacaan) {
  const standAwal = row.standAwalRevisi ?? row.standAwal ?? null
  const kondisi = row.kondisiRevisi ?? row.kondisi
  const kondisiNorm = (kondisi ?? "").trim().toUpperCase()
  const isMB = kondisiNorm === "MB"
  const isMudaKembali =
    kondisiNorm === "MUDA_KEMBALI" || kondisiNorm === "MUDA KEMBALI"

  const standAkhir =
    isMB && row.standMeterBaru != null
      ? row.standMeterBaru
      : (row.standAkhirRevisi ??
        row.pembacaan?.standAkhir ??
        row.standAkhir ??
        row.standAngkatLama ??
        null)

  const adaKoreksiStand =
    row.standAwalRevisi != null ||
    row.standAkhirRevisi != null ||
    row.standAngkatLama != null ||
    row.standMeterBaru != null ||
    Boolean(row.mbTanpaStandAngkat) ||
    row.digitRollover != null

  // 1. Untuk Meter Baru (MB):
  if (isMB && standAwal != null && standAkhir != null) {
    // Jika operator menetapkan angka Pakai secara kustom (mis. penyesuaian menjadi 5 m³), utamakan nilai kustom tersebut
    if (
      row.pemakaianRevisi != null &&
      (row.standAngkatLama != null || Boolean(row.mbTanpaStandAngkat))
    ) {
      return { standAwal, standAkhir, pemakaian: row.pemakaianRevisi }
    }
    if (row.standAngkatLama != null) {
      return {
        standAwal,
        standAkhir,
        pemakaian: hitungPemakaianGantiMeter({
          standAwalLama: standAwal,
          standAngkatLama: row.standAngkatLama,
          standMeterBaru: standAkhir,
          standPasang: row.standPasang ?? 0,
        }),
      }
    }
    if (row.mbTanpaStandAngkat) {
      return {
        standAwal,
        standAkhir,
        pemakaian: hitungPemakaianGantiMeter({
          standAwalLama: standAwal,
          standAngkatLama: null,
          standMeterBaru: standAkhir,
          standPasang: row.standPasang ?? 0,
          tanpaStandAngkat: true,
        }),
      }
    }
    if (row.pembacaan?.pemakaianRiil != null) {
      return { standAwal, standAkhir, pemakaian: row.pembacaan.pemakaianRiil }
    }
    // MB yang belum dikonfirmasi Stand Angkat maupun Override -> tampilkan indikator minus riil agar tidak terlewat!
    if (standAkhir < standAwal) {
      return { standAwal, standAkhir, pemakaian: standAkhir - standAwal }
    }
  }

  // 2. Untuk Muda Kembali (Rollover):
  if (isMudaKembali && standAwal != null && standAkhir != null) {
    if (row.pemakaianRevisi != null) {
      return { standAwal, standAkhir, pemakaian: row.pemakaianRevisi }
    }
    const rollover = hitungPemakaianMudaKembali({
      standAwal,
      standAkhir,
      ukuranMeter: row.ukuranMeter ?? null,
      jumlahDigitAset: row.jumlahDigitAset ?? null,
      digitOverride: row.digitRollover ?? null,
    })
    if (rollover.isValid) {
      return { standAwal, standAkhir, pemakaian: rollover.totalPemakaianM3 }
    }
  }

  // 3. Jika verifikator menetapkan pemakaianRevisi secara eksplisit (misal taksasi / perdir):
  if (row.pemakaianRevisi != null) {
    return { standAwal, standAkhir, pemakaian: row.pemakaianRevisi }
  }

  let pemakaian = row.pemakaian ?? row.pembacaan?.pemakaianRiil ?? null

  if (
    row.pembacaan?.pemakaianRiil != null &&
    !adaKoreksiStand &&
    row.kondisiRevisi == null
  ) {
    pemakaian = row.pembacaan.pemakaianRiil
  } else if (
    standAwal != null &&
    standAkhir != null &&
    (adaKoreksiStand || standAkhir !== standAwal)
  ) {
    pemakaian = standAkhir - standAwal
  }

  return { standAwal, standAkhir, pemakaian }
}
