import { describe, expect, it } from "bun:test"
import { tentukanHasilPembacaan } from "./hasil-pembacaan"

describe("tentukanHasilPembacaan", () => {
  it("uses revised meter stands before the original official reading", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 100,
        standAwalRevisi: 110,
        standAkhir: 200,
        standAkhirRevisi: 220,
        pemakaian: 100,
        pembacaan: {
          standAkhir: 200,
          pemakaianM3: 100,
          pemakaianRiil: 100,
        },
      }),
    ).toEqual({
      standAwal: 110,
      standAkhir: 220,
      pemakaian: 110,
    })
  })

  it("uses stand pasang when calculating MB consumption", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 565,
        standAkhir: 10,
        standAngkatLama: 600,
        standMeterBaru: 10,
        standPasang: 5,
        kondisi: "MB",
        pemakaian: 24,
      }),
    ).toEqual({
      standAwal: 565,
      standAkhir: 10,
      pemakaian: 40,
    })
  })

  it("shows real negative delta on unconfirmed MB without stand angkat or override", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 4421,
        standAkhir: 9,
        kondisi: "MB",
        pemakaian: 0,
      }),
    ).toEqual({
      standAwal: 4421,
      standAkhir: 9,
      pemakaian: -4412,
    })
  })

  it("calculates MB consumption cleanly when mbTanpaStandAngkat override is active", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 4421,
        standAkhir: 14,
        standPasang: 2,
        mbTanpaStandAngkat: true,
        kondisi: "MB",
        pemakaian: -4407,
      }),
    ).toEqual({
      standAwal: 4421,
      standAkhir: 14,
      pemakaian: 12,
    })
  })

  it("allows custom pemakaianRevisi (e.g. 5 m3) on confirmed/overridden MB row", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 1743,
        standAkhir: 1,
        standMeterBaru: 1,
        standPasang: 0,
        mbTanpaStandAngkat: true,
        pemakaianRevisi: 5,
        kondisi: "MB",
        pemakaian: 1,
      }),
    ).toEqual({
      standAwal: 1743,
      standAkhir: 1,
      pemakaian: 5,
    })
  })

  it("calculates MUDA_KEMBALI rollover consumption accurately", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 9998,
        standAkhir: 10,
        kondisi: "MUDA_KEMBALI",
        ukuranMeter: "1/2",
        pemakaian: -9988,
      }),
    ).toEqual({
      standAwal: 9998,
      standAkhir: 10,
      pemakaian: 12,
    })
  })

  it("preserves taksasi pemakaian when only kondisiRevisi changes and stands are equal", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 150,
        standAkhir: 150,
        pemakaian: 10,
        kondisi: "TIDAK_DIPAKAI",
        kondisiRevisi: "NORMAL",
      }),
    ).toEqual({
      standAwal: 150,
      standAkhir: 150,
      pemakaian: 10,
    })
  })

  it("uses explicit pemakaianRevisi even when standAwal and standAkhir are equal", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 150,
        standAkhir: 150,
        standAkhirRevisi: 150,
        pemakaian: 0,
        pemakaianRevisi: 12,
        kondisi: "NORMAL",
      }),
    ).toEqual({
      standAwal: 150,
      standAkhir: 150,
      pemakaian: 12,
    })
  })

  it("reverts immediately to standAkhir - standAwal when pemakaianRevisi is reset to null (e.g. 5 -> 10 -> 5)", () => {
    expect(
      tentukanHasilPembacaan({
        standAwal: 427,
        standAkhir: 432,
        pemakaian: 10, // nilai stale dari optimistic update sebelumnya
        pemakaianRevisi: null,
        kondisi: "Normal",
      }),
    ).toEqual({
      standAwal: 427,
      standAkhir: 432,
      pemakaian: 5,
    })
  })
})
