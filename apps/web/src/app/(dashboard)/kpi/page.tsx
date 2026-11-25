import type { Metadata } from "next"
import { KpiOperasionalView } from "@/features/dashboard/kpi"

export const metadata: Metadata = {
  title: "Kinerja & Insentif Petugas | M2C Tirtawening",
  description:
    "Evaluasi kinerja petugas pencatat meter, akurasi baca, faktor kesulitan medan rute, dan perhitungan insentif bulanan.",
}

export default async function KpiPage() {
  return (
    <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-hidden p-3.5 sm:p-4">
      <KpiOperasionalView initialPeriod="Nov 2026" />
    </div>
  )
}
