import type { Metadata } from "next"
import { KpiScorecardView } from "@/features/dashboard/kpi"
import {
  dapatkanPerspektifScorecard,
  dapatkanDaftarPemilikKpi,
} from "@/server/services/kpi/kpi.service"

export const metadata: Metadata = {
  title: "Strategy Scorecard (KPI) | M2C Tirtawening",
  description:
    "Executive Strategy Scorecard, Balanced KPI tracking across Financial and Customer perspectives.",
}

export default async function KpiPage() {
  const [initialPerspectives, initialOwners] = await Promise.all([
    dapatkanPerspektifScorecard("Nov 2026"),
    dapatkanDaftarPemilikKpi(),
  ])

  return (
    <KpiScorecardView
      initialPerspectives={initialPerspectives}
      initialOwners={initialOwners}
      initialPeriod="Nov 2026"
    />
  )
}
