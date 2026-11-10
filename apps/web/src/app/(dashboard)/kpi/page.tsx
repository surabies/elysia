import type { Metadata } from "next"
import { KpiScorecardView } from "@/features/dashboard/kpi"
import { dapatkanPerspektifScorecard } from "@/server/services/kpi/kpi.service"

export const metadata: Metadata = {
  title: "Strategy Scorecard (KPI) | M2C Tirtawening",
  description:
    "Executive Strategy Scorecard, Balanced KPI tracking across Financial and Customer perspectives.",
}

export default async function KpiPage() {
  const initialPerspectives = await dapatkanPerspektifScorecard("Sep 2026")
  return (
    <KpiScorecardView
      initialPerspectives={initialPerspectives}
      initialPeriod="Sep 2026"
    />
  )
}
