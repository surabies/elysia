import { hitungPemakaianGantiMeter } from "@/lib/domain/perhitungan-meter"
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
  | "pembacaan"
>

export function tentukanHasilPembacaan(row: DataPembacaan) {
  const standAwal = row.standAwalRevisi ?? row.standAwal ?? null
  const kondisi = row.kondisiRevisi ?? row.kondisi
  const standAkhir =
    kondisi === "MB" && row.standMeterBaru != null
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
    row.standMeterBaru != null

  // 1. Jika verifikator menetapkan pemakaianRevisi secara eksplisit (misal taksasi / perdir /
  //    kebijakan di mana ST Awal == ST Akhir tetapi Pakai diatur manual), gunakan nilai tersebut.
  if (row.pemakaianRevisi != null) {
    return { standAwal, standAkhir, pemakaian: row.pemakaianRevisi }
  }

  let pemakaian =
    row.pemakaian ??
    row.pembacaan?.pemakaianRiil ??
    null

  if (
    row.pembacaan?.pemakaianRiil != null &&
    !adaKoreksiStand &&
    row.kondisiRevisi == null
  ) {
    pemakaian = row.pembacaan.pemakaianRiil
  } else if (adaKoreksiStand && standAwal != null) {
    pemakaian =
      kondisi === "MB" &&
      row.standAngkatLama != null &&
      row.standMeterBaru != null
        ? hitungPemakaianGantiMeter({
            standAwalLama: standAwal,
            standAngkatLama: row.standAngkatLama,
            standMeterBaru: row.standMeterBaru,
            standPasang: row.standPasang ?? 0,
          })
        : standAkhir != null
          ? standAkhir - standAwal
          : null
  }

  return { standAwal, standAkhir, pemakaian }
}
