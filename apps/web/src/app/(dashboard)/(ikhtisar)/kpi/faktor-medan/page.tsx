import type { Metadata } from "next"
import { KpiScorecardView } from "@/features/dashboard/kpi"
import { dapatkanPerspektifScorecard } from "@/server/services/kpi/kpi.service"

export const metadata: Metadata = {
  title: "Konfigurasi Faktor Medan Rute (ABK) | KPI M2C Tirtawening",
  description:
    "Manajemen klasifikasi topografi lereng/tebing, moda akses, dan faktor medan pembobotan beban kerja 125 rute catat meter.",
}

export default async function KpiFaktorMedanPage() {
  const initialPerspectives = await dapatkanPerspektifScorecard("Nov 2026")
  return (
    <KpiScorecardView
      initialPerspectives={initialPerspectives}
      initialPeriod="Nov 2026"
      initialTab="medan"
    />
  )
}
