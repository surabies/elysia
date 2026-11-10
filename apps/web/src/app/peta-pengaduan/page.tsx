import type { Metadata } from "next"
import { PetaPengaduanView } from "@/features/peta-pengaduan"
import {
  batasKecamatanFC,
  batasKelurahanFC,
  titikPelangganFC,
} from "@/server/services/geo/boundary.service"
import { pengaduanService } from "@/server/services/pengaduan/pengaduan.service"
import { petakanBarisDbKePengaduan } from "@/features/peta-pengaduan/lib/ApiPengaduan"

export const metadata: Metadata = {
  title: "Peta Pengaduan Air | PERUMDA Tirtawening",
  description:
    "Peta spasial interaktif monitoring pengaduan gangguan air dan wilayah PERUMDA Tirtawening Kota Bandung.",
}

export const dynamic = "force-dynamic"

export default async function PetaPengaduanPage() {
  const [kelurahan, kecamatan, pelanggan, rawPengaduan] = await Promise.all([
    batasKelurahanFC().catch(() => null),
    batasKecamatanFC().catch(() => null),
    titikPelangganFC(10000).catch(() => null),
    pengaduanService.getPengaduanPetaPublik().catch(() => []),
  ])

  const dataAwal = petakanBarisDbKePengaduan(rawPengaduan)

  return (
    <PetaPengaduanView
      kelurahan={kelurahan}
      kecamatan={kecamatan}
      pelanggan={pelanggan}
      dataAwal={dataAwal}
    />
  )
}
