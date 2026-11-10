import { describe, expect, it } from "bun:test"
import {
  deriveKpiDirection,
  getUnitAdornment,
  isKpiFormDirty,
  parseNumericField,
  validateKpiForm,
} from "../apps/web/src/features/dashboard/kpi/lib/KpiFormValidation"
import type { NewKpiFormData } from "../apps/web/src/features/dashboard/kpi/types/KpiTypes"

describe("KPI Form Logic & Validation", () => {
  it("derives correct direction based on baseline and target", () => {
    expect(deriveKpiDirection(10, 20)).toBe("higher")
    expect(deriveKpiDirection(85, 60)).toBe("lower")
    expect(deriveKpiDirection(100, 100)).toBeNull()
  })

  it("provides unit prefix and suffix correctly", () => {
    expect(getUnitAdornment("percent")).toEqual({ prefix: "", suffix: "%" })
    expect(getUnitAdornment("currency")).toEqual({ prefix: "$", suffix: "" })
    expect(getUnitAdornment("decimal")).toEqual({ prefix: "", suffix: "" })
  })

  it("parses numeric strings with special characters", () => {
    expect(parseNumericField("$1,250.50")).toBe(1250.5)
    expect(parseNumericField("85.5%")).toBe(85.5)
    expect(parseNumericField("")).toBeNull()
    expect(parseNumericField("invalid")).toBeNull()
  })

  it("validates valid new KPI form with optional actual value", () => {
    const validForm: NewKpiFormData = {
      name: "Tingkat Akurasi Catat Meter",
      objectiveId: "obj-ops-1",
      ownerId: "usr-1",
      unit: "percent",
      weight: "25",
      baseline: "80",
      target: "98",
      actual: "89",
    }

    const result = validateKpiForm(validForm)
    expect(result.isValid).toBe(true)
    expect(result.parsed).toBeDefined()
    expect(result.parsed?.direction).toBe("higher")
    expect(result.parsed?.weight).toBe(25)
    expect(result.parsed?.baseline).toBe(80)
    expect(result.parsed?.target).toBe(98)
    expect(result.parsed?.value).toBe(89)
    expect(result.parsed?.format).toBe("percent")
  })

  it("accepts blank actual value as null (no actual)", () => {
    const formWithoutActual: NewKpiFormData = {
      name: "Tingkat Kehilangan Air NRW",
      objectiveId: "obj-ops-1",
      ownerId: "usr-2",
      unit: "percent",
      weight: "30",
      baseline: "42",
      target: "25",
      actual: "",
    }

    const result = validateKpiForm(formWithoutActual)
    expect(result.isValid).toBe(true)
    expect(result.parsed?.direction).toBe("lower")
    expect(result.parsed?.value).toBeNull()
  })

  it("rejects equal baseline and target", () => {
    const invalidForm: NewKpiFormData = {
      name: "Collection Ratio",
      objectiveId: "obj-fin-1",
      ownerId: "usr-1",
      unit: "percent",
      weight: "20",
      baseline: "90",
      target: "90",
      actual: "",
    }

    const result = validateKpiForm(invalidForm)
    expect(result.isValid).toBe(false)
    expect(result.errors.target).toContain("sama dengan nilai baseline")
  })

  it("rejects invalid weight out of bounds", () => {
    const invalidForm: NewKpiFormData = {
      name: "Test Weight",
      objectiveId: "obj-fin-1",
      ownerId: "usr-1",
      unit: "percent",
      weight: "150",
      baseline: "10",
      target: "20",
      actual: "",
    }

    const result = validateKpiForm(invalidForm)
    expect(result.isValid).toBe(false)
    expect(result.errors.weight).toContain("antara 0% dan 100%")
  })

  it("tracks dirty state correctly", () => {
    const emptyForm: NewKpiFormData = {
      name: "",
      objectiveId: "obj-1",
      ownerId: "usr-1",
      unit: "percent",
      weight: "",
      baseline: "",
      target: "",
      actual: "",
    }

    expect(isKpiFormDirty(emptyForm, "obj-1", "usr-1")).toBe(false)

    const dirtyForm = { ...emptyForm, name: "Some Name" }
    expect(isKpiFormDirty(dirtyForm, "obj-1", "usr-1")).toBe(true)
  })
})
