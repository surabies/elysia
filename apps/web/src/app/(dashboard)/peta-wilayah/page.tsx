import type { Metadata } from "next"
import { PetaWilayahView } from "@/features/dashboard/peta-wilayah"

export const metadata: Metadata = {
  title: "Peta Wilayah Operasional | M2C Tirtawening",
  description:
    "Visualisasi batas wilayah administrasi, rute catat meter, titik pelanggan, dan antrean kebocoran pipa dinas Kota Bandung.",
}

export default async function PetaWilayahPage() {
  return <PetaWilayahView />
}
