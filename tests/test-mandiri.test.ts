import { describe, it, expect } from "bun:test"
import { db, caterMandiriPelanggan } from "@cater/db"
import { eq } from "drizzle-orm"
import { mandiriService } from "@/server/services/mandiri/mandiri.service"

describe("Lapor Mandiri UAT Flow", () => {
  it("sukses submit laporan mandiri Januari 2026 dan mencatat stma yang tepat", async () => {
    const nolgTest = "00401200610"
    const stmaTest = 245

    // Bersihkan dulu jika ada sisa
    await db
      .delete(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.nolg, nolgTest))

    const result = await mandiriService.submitLaporanMandiri({
      thbl: "202601",
      nolg: nolgTest,
      stma: stmaTest,
      fotoMeterUrl: "https://placehold.co/600x400/png?text=Foto+Meter+Januari",
      channel: "WEB_PORTAL",
    })

    expect(result.id).toBe(`mandiri-202601-${nolgTest}`)
    expect(result.thbl).toBe("202601")
    expect(result.stma).toBe(245)

    const [row] = await db
      .select()
      .from(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.nolg, nolgTest))

    expect(row).toBeDefined()
    expect(row.thbl).toBe("202601")
    expect(Number(row.stma)).toBe(245)

    // Bersihkan kembali agar user bisa langsung mengetes lewat UI web browser
    await db
      .delete(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.nolg, nolgTest))
  })
})
