import { hitungPemakaianGantiMeter } from "@/lib/domain/perhitungan-meter"
import type { BarisVerifikasi } from "../types"

type DataPembacaan = Pick<
  BarisVerifikasi,
  | "standAwal"
  | "standAwalRevisi"
  | "standAkhir"
  | "standAkhirRevisi"
  | "pemakaian"
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
  const adaKoreksi =
    row.standAwalRevisi != null ||
    row.standAkhirRevisi != null ||
    row.kondisiRevisi != null ||
    row.standAngkatLama != null ||
    row.standMeterBaru != null

  let pemakaian =
    row.pemakaian ??
    row.pembacaan?.pemakaianRiil ??
    null

  if (
    row.pembacaan?.pemakaianRiil != null &&
    row.standAwalRevisi == null &&
    row.standAkhirRevisi == null &&
    row.kondisiRevisi == null &&
    row.standAngkatLama == null &&
    row.standMeterBaru == null
  ) {
    pemakaian = row.pembacaan.pemakaianRiil
  } else if (adaKoreksi && standAwal != null) {
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
