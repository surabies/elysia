import type {
  Direction,
  FormatType,
  KpiFormErrors,
  KpiUnitOption,
  NewKpiFormData,
} from "../types/KpiTypes"

export interface ParsedNewKpi {
  name: string
  objectiveId: string
  ownerId: string
  direction: Direction
  weight: number
  baseline: number
  target: number
  value: number | null
  format: FormatType
}

/**
 * Menurunkan arah KPI dari baseline dan target:
 * target > baseline -> higher is better (↑)
 * target < baseline -> lower is better (↓)
 */
export function deriveKpiDirection(baseline: number, target: number): Direction | null {
  if (target > baseline) return "higher"
  if (target < baseline) return "lower"
  return null
}

/**
 * Menentukan awalan dan akhiran tampilan berdasarkan unit
 */
export function getUnitAdornment(unit: KpiUnitOption): { prefix: string; suffix: string } {
  switch (unit) {
    case "percent":
      return { prefix: "", suffix: "%" }
    case "currency":
      return { prefix: "$", suffix: "" }
    case "decimal":
    default:
      return { prefix: "", suffix: "" }
  }
}

/**
 * Membersihkan dan mem-parse teks input angka (menghapus $, %, koma)
 */
export function parseNumericField(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[$%,]/g, "")
  const parsed = Number(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Validasi murni untuk form KPI baru
 */
export function validateKpiForm(form: NewKpiFormData): {
  isValid: boolean
  errors: KpiFormErrors
  parsed?: ParsedNewKpi
} {
  const errors: KpiFormErrors = {}

  // 1. Name
  const trimmedName = form.name.trim()
  if (!trimmedName) {
    errors.name = "Nama indikator KPI wajib diisi"
  } else if (trimmedName.length < 3) {
    errors.name = "Nama indikator minimal 3 karakter"
  }

  // 2. Objective
  if (!form.objectiveId) {
    errors.objectiveId = "Silakan pilih sasaran kerja (objektif)"
  }

  // 3. Owner
  if (!form.ownerId) {
    errors.ownerId = "Silakan pilih penanggung jawab (aktor)"
  }

  // 4. Weight (0 - 100)
  if (!form.weight.trim()) {
    errors.weight = "Bobot kontribusi wajib diisi"
  } else {
    const parsedWeight = parseNumericField(form.weight)
    if (parsedWeight === null) {
      errors.weight = "Bobot harus berupa angka valid"
    } else if (parsedWeight < 0 || parsedWeight > 100) {
      errors.weight = "Bobot harus bernilai antara 0% dan 100%"
    }
  }

  // 5. Baseline
  let parsedBaseline: number | null = null
  if (!form.baseline.trim()) {
    errors.baseline = "Baseline awal wajib diisi"
  } else {
    parsedBaseline = parseNumericField(form.baseline)
    if (parsedBaseline === null) {
      errors.baseline = "Baseline harus berupa angka valid"
    }
  }

  // 6. Target
  let parsedTarget: number | null = null
  if (!form.target.trim()) {
    errors.target = "Target akhir tahun wajib diisi"
  } else {
    parsedTarget = parseNumericField(form.target)
    if (parsedTarget === null) {
      errors.target = "Target akhir tahun harus berupa angka valid"
    } else if (parsedBaseline !== null && parsedTarget === parsedBaseline) {
      errors.target = "Target tidak boleh sama dengan nilai baseline"
    }
  }

  // 7. Actual (opsional)
  let parsedActual: number | null = null
  if (form.actual.trim()) {
    parsedActual = parseNumericField(form.actual)
    if (parsedActual === null) {
      errors.actual = "Nilai aktual harus berupa angka atau dikosongkan"
    }
  }

  const isValid = Object.keys(errors).length === 0

  if (!isValid || parsedBaseline === null || parsedTarget === null) {
    return { isValid: false, errors }
  }

  const direction = deriveKpiDirection(parsedBaseline, parsedTarget)
  if (!direction) {
    errors.target = "Target tidak boleh sama dengan nilai baseline"
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: {},
    parsed: {
      name: trimmedName,
      objectiveId: form.objectiveId,
      ownerId: form.ownerId,
      direction,
      weight: parseNumericField(form.weight) ?? 0,
      baseline: parsedBaseline,
      target: parsedTarget,
      value: parsedActual,
      format: form.unit,
    },
  }
}

/**
 * Cek apakah form sudah disentuh pengguna dari keadaan awal
 */
export function isKpiFormDirty(
  form: NewKpiFormData,
  initialObjectiveId = "",
  initialOwnerId = ""
): boolean {
  if (form.name.trim().length > 0) return true
  if (form.baseline.trim().length > 0) return true
  if (form.target.trim().length > 0) return true
  if (form.actual.trim().length > 0) return true
  if (form.weight.trim().length > 0) return true
  if (form.objectiveId && form.objectiveId !== initialObjectiveId) return true
  if (form.ownerId && form.ownerId !== initialOwnerId) return true
  return false
}
