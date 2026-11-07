import { describe, expect, it } from "bun:test"
import { tentukanHasilPembacaan } from "./HasilPembacaan"

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
})
