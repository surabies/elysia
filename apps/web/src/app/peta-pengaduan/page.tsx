import type { Metadata } from "next"
import { PetaPengaduanView } from "@/features/peta-pengaduan"
import {
  batasKecamatanFC,
  batasKelurahanFC,
  titikPelangganFC,
} from "@/server/services/geo/boundary.service"
import { pengaduanService } from "@/server/services/pengaduan/pengaduan.service"
import { petakanBarisDbKePengaduan } from "@/features/peta-pengaduan/lib/ApiPengaduan"
import { auth } from "@/lib/auth/index"

export const metadata: Metadata = {
  title: "Peta Kendali Layanan Air | PERUMDA Tirtawening",
  description:
    "Peta spasial interaktif monitoring distribusi air dan pengaduan gangguan wilayah PERUMDA Tirtawening Kota Bandung.",
}

export const dynamic = "force-dynamic"

const DAFTAR_ROLE_OPERATOR = [
  "SUPERADMIN",
  "EXECUTIVE",
  "VERIFIKATOR_3",
  "VERIFIKATOR_2",
  "VERIFIKATOR_1",
  "STAFF_ADMIN_BILLING",
  "PENCATAT",
  "PELAKSANA",
  "ADMIN",
  "DIREKSI",
  "SENIOR_MANAGER",
  "MANAGER",
  "SUPERVISOR",
  "STAFF",
]

interface PageProps {
  searchParams?: Promise<{ mode?: string }>
}

export default async function PetaPengaduanPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const session = await auth()
  const userRoles = session?.user?.roles ?? []
  const memilikiAksesOperator = userRoles.some((r) =>
    DAFTAR_ROLE_OPERATOR.includes(r as string)
  )

  // Hanya pengguna internal dengan role operasional yang dapat melihat panel kendali operator.
  // Warga/pelanggan publik tanpa hak akses operator secara ketat dibatasi ke mode pelanggan publik.
  const isOperator = memilikiAksesOperator && resolvedParams.mode !== "publik"

  const [kelurahan, kecamatan, pelanggan, rawPengaduan] = await Promise.all([
    batasKelurahanFC().catch(() => null),
    batasKecamatanFC().catch(() => null),
    titikPelangganFC(10000).catch(() => null),
    // Ambil data antrean tiket aduan dan riwayat tindakan HANYA jika viewer adalah operator internal
    isOperator
      ? pengaduanService.getPengaduanPetaPublik().catch(() => [])
      : Promise.resolve([]),
  ])

  const dataAwal = isOperator ? petakanBarisDbKePengaduan(rawPengaduan) : []

  return (
    <PetaPengaduanView
      kelurahan={kelurahan}
      kecamatan={kecamatan}
      pelanggan={pelanggan}
      dataAwal={dataAwal}
      isOperator={isOperator}
    />
  )
}
