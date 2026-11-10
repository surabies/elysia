import { describe, expect, it } from "bun:test"
import { app } from "../apps/web/src/server/app"
import {
  dapatkanPerspektifScorecard,
  tambahKpiBaru,
  perbaruiNilaiAktualKpi,
} from "../apps/web/src/server/services/kpi/kpi.service"

describe("KPI Scorecard Backend & PostgreSQL Integration", () => {
  it("fetches perspectives from database with authentic Catat Meter categories", async () => {
    const perspectives = await dapatkanPerspektifScorecard("Sep 2026")
    expect(perspectives).toBeArray()
    expect(perspectives.length).toBe(4)

    const names = perspectives.map((p) => p.name)
    expect(names.some((n) => n.includes("Pencatatan Meter Lapangan"))).toBe(true)
    expect(names.some((n) => n.includes("Verifikasi & Screening Anomali"))).toBe(true)
    expect(names.some((n) => n.includes("Closing & Penagihan DRD"))).toBe(true)
    expect(names.some((n) => n.includes("Integrasi Mandiri"))).toBe(true)

    // Periksa bahwa objektif dan KPI ter-nesting dengan benar
    const caterLap = perspectives.find((p) => p.id === "cater-lapangan")
    expect(caterLap).toBeDefined()
    expect(caterLap?.objectives.length).toBeGreaterThanOrEqual(1)
    expect(caterLap?.objectives[0].kpis.length).toBeGreaterThanOrEqual(1)

    // Periksa owner yang terhubung adalah role nyata project
    const readRateKpi = caterLap?.objectives[0].kpis.find((k) => k.id === "kpi-read-rate-rute")
    expect(readRateKpi).toBeDefined()
    expect(readRateKpi?.owner.name).toContain("Dadang (Pencatat Lapangan)")
  })

  it("adds a new KPI directly to PostgreSQL and retrieves it with project owner", async () => {
    const newKpiName = `Uji Kepatuhan Petugas Lapangan ${Date.now()}`
    const result = await tambahKpiBaru(
      {
        name: newKpiName,
        objectiveId: "obj-keterbacaan-cater",
        ownerId: "user-pencatat-dadang",
        direction: "higher",
        weight: 15,
        baseline: 80,
        target: 95,
        value: 90,
        format: "percent",
      },
      "Sep 2026",
      { name: "Dadang (Pencatat Lapangan)", initials: "PL" }
    )

    expect(result.success).toBe(true)
    expect(result.id).toBeString()

    // Ambil ulang scorecard
    const updated = await dapatkanPerspektifScorecard("Sep 2026")
    const caterLap = updated.find((p) => p.id === "cater-lapangan")
    const foundKpi = caterLap?.objectives
      .flatMap((o) => o.kpis)
      .find((k) => k.name === newKpiName)

    expect(foundKpi).toBeDefined()
    expect(foundKpi?.baseline).toBe(80)
    expect(foundKpi?.target).toBe(95)
    expect(foundKpi?.value).toBe(90)
    expect(foundKpi?.owner.name).toContain("Dadang")
  })

  it("updates KPI actual value in database", async () => {
    const testKpiId = "kpi-read-rate-rute"
    const success = await perbaruiNilaiAktualKpi(testKpiId, "Sep 2026", 97.5)
    expect(success).toBe(true)

    const updated = await dapatkanPerspektifScorecard("Sep 2026")
    const kpi = updated
      .flatMap((p) => p.objectives)
      .flatMap((o) => o.kpis)
      .find((k) => k.id === testKpiId)

    expect(kpi?.value).toBe(97.5)
  })

  it("serves HTTP GET /api/kpi via Elysia endpoint with 200 OK", async () => {
    const req = new Request("http://localhost/api/kpi?periode=Sep%202026")
    const res = await app.handle(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.periode).toBe("Sep 2026")
    expect(json.data.length).toBe(4)
  })
})
