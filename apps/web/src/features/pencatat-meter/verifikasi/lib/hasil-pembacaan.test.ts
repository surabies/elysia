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
})
