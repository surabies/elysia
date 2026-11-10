import {
  db,
  kpiPerspektif,
  kpiObjektif,
  kpiIndikator,
  kpiRealisasi,
} from "@cater/db"
import { eq, asc } from "drizzle-orm"
import type {
  Perspective,
  Objective,
  KpiItem,
  Direction,
  FormatType,
  KpiOwner,
} from "@/features/dashboard/kpi/types/KpiTypes"
import type { ParsedNewKpi } from "@/features/dashboard/kpi/lib/KpiFormValidation"

function dapatkanBaris<T = any>(res: any): T[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.rows)) return res.rows
  return []
}

/**
 * Mengambil seluruh struktur Balanced Scorecard (Perspektif -> Objektif -> Indikator -> Realisasi)
 * dari PostgreSQL sesuai periode yang dipilih.
 */
export async function dapatkanPerspektifScorecard(
  periode = "Sep 2026"
): Promise<Perspective[]> {
  const [perspRows, objRows, indRows, realRows] = await Promise.all([
    db.select().from(kpiPerspektif).orderBy(asc(kpiPerspektif.urutan)),
    db.select().from(kpiObjektif).orderBy(asc(kpiObjektif.urutan)),
    db.select().from(kpiIndikator).orderBy(asc(kpiIndikator.urutan)),
    db.select().from(kpiRealisasi).where(eq(kpiRealisasi.periode, periode)),
  ])

  const perspektifList = dapatkanBaris(perspRows)
  const objektifList = dapatkanBaris(objRows)
  const indikatorList = dapatkanBaris(indRows)
  const realisasiList = dapatkanBaris(realRows)

  // Map realisasi berdasarkan indikatorId
  const realisasiMap = new Map<string, any>()
  realisasiList.forEach((r) => {
    realisasiMap.set(r.indikatorId, r)
  })

  // Bangun daftar KpiItem terkelompok berdasarkan objektifId
  const kpisPerObjektif = new Map<string, KpiItem[]>()
  indikatorList.forEach((ind) => {
    const real = realisasiMap.get(ind.id)
    const val = real?.nilaiAktual ?? null

    let sparkline: number[] = [ind.baseline, ind.baseline, val ?? ind.baseline]
    if (real?.sparkline) {
      try {
        const parsed = JSON.parse(real.sparkline)
        if (Array.isArray(parsed) && parsed.length > 0) {
          sparkline = parsed
        }
      } catch {
        // Fallback to baseline
      }
    }

    const owner: KpiOwner = {
      id: ind.pemilikId,
      name: ind.pemilikNama,
      initials: ind.pemilikInisial,
    }

    const item: KpiItem = {
      id: ind.id,
      name: ind.nama,
      direction: ind.arah as Direction,
      owner,
      weight: ind.bobot,
      baseline: ind.baseline,
      value: val,
      target: ind.target,
      format: ind.format as FormatType,
      currencySymbol: ind.simbolMataUang ?? undefined,
      unitMultiplier: ind.pengaliSatuan ?? 1,
      change: {
        direction: val !== null && val >= ind.baseline ? "up" : "neutral",
        diff: 0,
        sparkline,
      },
      laggingMarket: null,
    }

    const existing = kpisPerObjektif.get(ind.objektifId) ?? []
    existing.push(item)
    kpisPerObjektif.set(ind.objektifId, existing)
  })

  // Bangun daftar Objective terkelompok berdasarkan perspektifId
  const objectivesPerPersp = new Map<string, Objective[]>()
  objektifList.forEach((obj) => {
    const objItem: Objective = {
      id: obj.id,
      name: obj.nama,
      kpis: kpisPerObjektif.get(obj.id) ?? [],
    }

    const existing = objectivesPerPersp.get(obj.perspektifId) ?? []
    existing.push(objItem)
    objectivesPerPersp.set(obj.perspektifId, existing)
  })

  // Bangun list Perspektif lengkap
  const result: Perspective[] = perspektifList.map((p) => ({
    id: p.id,
    name: p.nama,
    scoreWeightPercent: p.bobotSkor,
    description: p.deskripsi ?? "",
    objectives: objectivesPerPersp.get(p.id) ?? [],
  }))

  return result
}

/**
 * Menyimpan indikator KPI baru ke tabel PostgreSQL
 */
export async function tambahKpiBaru(
  input: ParsedNewKpi,
  periode = "Sep 2026",
  ownerDetails?: { name: string; initials: string }
): Promise<{ success: boolean; id: string }> {
  const newId = `kpi-${Date.now()}`
  const ownerName = ownerDetails?.name ?? input.ownerId
  const ownerInitials = ownerDetails?.initials ?? input.ownerId.slice(0, 1).toUpperCase()

  // 1. Simpan ke kpi_indikator
  await db.insert(kpiIndikator).values({
    id: newId,
    objektifId: input.objectiveId,
    nama: input.name,
    arah: input.direction,
    pemilikId: input.ownerId,
    pemilikNama: ownerName,
    pemilikInisial: ownerInitials,
    bobot: input.weight,
    baseline: input.baseline,
    target: input.target,
    format: input.format,
    simbolMataUang: input.format === "currency" ? "Rp" : "",
    pengaliSatuan: 1,
    sumberData: "manual",
  })

  // 2. Simpan realisasi awal jika ada nilai
  if (input.value !== null) {
    const realisasiId = `${newId}_${periode}`
    await db
      .insert(kpiRealisasi)
      .values({
        id: realisasiId,
        indikatorId: newId,
        periode,
        nilaiAktual: input.value,
        sparkline: JSON.stringify([input.baseline, input.value]),
      })
      .onConflictDoUpdate({
        target: kpiRealisasi.id,
        set: {
          nilaiAktual: input.value,
          updatedAt: new Date(),
        },
      })
  }

  return { success: true, id: newId }
}

/**
 * Memperbarui nilai aktual (actual) KPI untuk periode tertentu
 */
export async function perbaruiNilaiAktualKpi(
  kpiId: string,
  periode: string,
  nilai: number | null
): Promise<boolean> {
  const realisasiId = `${kpiId}_${periode}`

  await db
    .insert(kpiRealisasi)
    .values({
      id: realisasiId,
      indikatorId: kpiId,
      periode,
      nilaiAktual: nilai,
    })
    .onConflictDoUpdate({
      target: kpiRealisasi.id,
      set: {
        nilaiAktual: nilai,
        updatedAt: new Date(),
      },
    })

  return true
}

/**
 * Memperbarui bobot KPI
 */
export async function perbaruiBobotKpi(
  kpiId: string,
  bobot: number
): Promise<boolean> {
  await db
    .update(kpiIndikator)
    .set({
      bobot,
      updatedAt: new Date(),
    })
    .where(eq(kpiIndikator.id, kpiId))

  return true
}

/**
 * Memperbarui penanggung jawab (owner) KPI
 */
export async function perbaruiPemilikKpi(
  kpiId: string,
  pemilikId: string,
  pemilikNama: string,
  pemilikInisial: string
): Promise<boolean> {
  await db
    .update(kpiIndikator)
    .set({
      pemilikId,
      pemilikNama,
      pemilikInisial,
      updatedAt: new Date(),
    })
    .where(eq(kpiIndikator.id, kpiId))

  return true
}
