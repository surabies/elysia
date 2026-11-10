import { describe, expect, it } from "bun:test"
import {
  calculateKpiProgress,
  calculateToGo,
  getKpiStatus,
  calculateObjectiveMetrics,
  calculateCompanySummary,
  formatKpiNumber,
  parseKpiInputValue,
} from "../apps/web/src/features/dashboard/kpi/lib/KpiCalculations"
import type { Objective, Perspective } from "../apps/web/src/features/dashboard/kpi/types/KpiTypes"

describe("KPI Scorecard Calculations Engine (Pure & Deterministic)", () => {
  it("1. ARR progress matches docs calculation: (22.99 - 18.40) / (24.00 - 18.40) = 82%", () => {
    // Annual Recurring Revenue: Baseline 18.40M, Value 22.99M, Target 24.00M, higher is better
    const progress = calculateKpiProgress(18.40, 22.99, 24.00, "higher")
    expect(progress).toBe(82)
    expect(getKpiStatus(progress)).toBe("on_track")
  })

  it("2. Discount Rate progress matches docs calculation: (14.0 - 12.5) / (14.0 - 10.0) = 38%", () => {
    // Discount Rate: Baseline 14.0, Value 12.5, Target 10.0, lower is better
    const progress = calculateKpiProgress(14.0, 12.5, 10.0, "lower")
    expect(progress).toBe(38)
    expect(getKpiStatus(progress)).toBe("off_track")
  })

  it("3. Grow Recurring Revenue objective progress matches: 0.40*82 + 0.35*60 + 0.25*88 = 76%", () => {
    const objective: Objective = {
      id: "obj-1",
      name: "Grow Recurring Revenue",
      kpis: [
        {
          id: "arr",
          name: "Annual Recurring Revenue",
          direction: "higher",
          owner: { id: "nick", name: "Nick", initials: "N" },
          weight: 40,
          baseline: 18.4,
          value: 22.99,
          target: 24.0,
          format: "currency",
          unitMultiplier: 1_000_000,
          change: { direction: "neutral", diff: 0, sparkline: [1, 2, 3] },
          laggingMarket: null,
        },
        {
          id: "trial",
          name: "Trial to Paid",
          direction: "higher",
          owner: { id: "sana", name: "Sana", initials: "S" },
          weight: 35,
          baseline: 14.0,
          value: 17.6,
          target: 20.0,
          format: "percent",
          change: { direction: "up", diff: 2, sparkline: [1, 2, 3] },
          laggingMarket: null,
        },
        {
          id: "checkout",
          name: "Checkout Conversion",
          direction: "higher",
          owner: { id: "david", name: "David", initials: "D" },
          weight: 25,
          baseline: 30.0,
          value: 38.8,
          target: 40.0,
          format: "percent",
          change: { direction: "down", diff: -1, sparkline: [1, 2, 3] },
          laggingMarket: null,
        },
      ],
    }

    const calculated = calculateObjectiveMetrics(objective)
    // 0.40*82 (32.8) + 0.35*60 (21.0) + 0.25*88 (22.0) = 75.8 -> round 76%
    expect(calculated.progress).toBe(76)
    expect(calculated.status).toBe("on_track")
  })

  it("4. To Go calculation returns absolute difference", () => {
    expect(calculateToGo(22.99, 24.00)).toBeCloseTo(1.01, 2)
    expect(calculateToGo(null, 24.00)).toBeNull()
  })

  it("5. Status boundaries follow single source of truth rules", () => {
    expect(getKpiStatus(70)).toBe("on_track")
    expect(getKpiStatus(69)).toBe("watch")
    expect(getKpiStatus(45)).toBe("watch")
    expect(getKpiStatus(44)).toBe("off_track")
    expect(getKpiStatus(null)).toBe("no_actual")
  })

  it("6. Value formatting handles currency, percent, and decimal accurately", () => {
    expect(formatKpiNumber(18_400_000, "currency", { unitMultiplier: 1_000_000 })).toBe("$18.40M")
    expect(formatKpiNumber(9.4, "currency")).toBe("$9.40")
    expect(formatKpiNumber(14.0, "percent")).toBe("14.0%")
    expect(formatKpiNumber(4.6, "decimal")).toBe("4.6")
    expect(formatKpiNumber(null, "decimal")).toBe("-")
  })

  it("7. parseKpiInputValue parses string user inputs correctly", () => {
    expect(parseKpiInputValue("$22.99M", "currency", 1_000_000)).toBe(22_990_000)
    expect(parseKpiInputValue("17.6%", "percent")).toBe(17.6)
    expect(parseKpiInputValue("8.48", "currency")).toBe(8.48)
    expect(parseKpiInputValue("-", "decimal")).toBeNull()
  })
})
