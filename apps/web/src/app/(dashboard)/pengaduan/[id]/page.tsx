import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/index"
import { DetailTiket } from "@/features/dashboard/pengaduan/components/detail-tiket/index"

export const metadata: Metadata = {
  title: "Lembar Kerja Pengaduan — PDAM Tirtawening",
  description: "Dossier penanganan tiket pengaduan pelanggan, linimasa audit, dan interaksi petugas.",
}

export default async function DetailPengaduanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <PageContainer
      breadcrumbs={[
        { label: "Daftar Pengaduan", href: "/pengaduan" },
        { label: id },
      ]}
    >
      <DetailTiket pengaduanId={id} />
    </PageContainer>
  )
}
