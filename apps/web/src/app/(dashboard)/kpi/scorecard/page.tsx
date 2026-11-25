import type { Metadata } from "next"
import { KpiCorporateScorecardView } from "@/features/dashboard/kpi"
import {
  dapatkanPerspektifScorecard,
  dapatkanDaftarPemilikKpi,
} from "@/server/services/kpi/kpi.service"

export const metadata: Metadata = {
  title: "Balanced Scorecard Perusahaan (M2C) | Tirtawening",
  description:
    "Executive Balanced Scorecard, 4 perspektif kinerja unit berbasis data transaksi riil sistem.",
}

export default async function KpiCorporateScorecardPage() {
  const [initialPerspectives, initialOwners] = await Promise.all([
    dapatkanPerspektifScorecard("Nov 2026"),
    dapatkanDaftarPemilikKpi(),
  ])

  return (
    <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-hidden p-3.5 sm:p-4">
      <KpiCorporateScorecardView
        initialPerspectives={initialPerspectives}
        initialOwners={initialOwners}
        initialPeriod="Nov 2026"
      />
    </div>
  )
}
