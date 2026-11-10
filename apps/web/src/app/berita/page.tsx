import type { Metadata } from "next"
import {
  Bagian,
  HalamanInfo,
  KontenContoh,
} from "@/components/shared/HalamanInfo"

export const metadata: Metadata = { title: "Berita" }

type Berita = {
  slug: string
  judul: string
  ringkasan: string
  tanggal: string
}

const DAFTAR_BERITA: Berita[] = [
  {
    slug: "modernisasi-baca-meter",
    judul: "Modernisasi Sistem Baca Meter Digital Kota Bandung",
    ringkasan:
      "PERUMDA Tirtawening mempercepat digitalisasi pencatatan meter berbasis foto geospasial demi transparansi dan keakuratan penagihan air minum.",
    tanggal: "2026-01-15",
  },
  {
    slug: "optimalisasi-aliran",
    judul: "Optimalisasi Aliran Air Bersih Wilayah Timur Bandung",
    ringkasan:
      "Peremajaan jaringan pipa transmisi dan distribusi di kawasan Gedebage dan sekitarnya guna memastikan kontinuitas pasokan air 24 jam.",
    tanggal: "2026-02-01",
  },
]

export default function BeritaPage() {
  return (
    <HalamanInfo
      judul="Berita"
      deskripsi="Kabar terbaru dan pengumuman resmi dari PERUMDA Tirtawening Kota Bandung."
    >
      <Bagian judul="Berita terbaru">
        <ul className="flex flex-col gap-3">
          {DAFTAR_BERITA.map((b) => (
            <li
              key={b.slug}
              className="rounded-lg border border-border bg-card p-4"
            >
              <time
                dateTime={b.tanggal}
                className="text-xs text-muted-foreground"
              >
                {b.tanggal}
              </time>
              <p className="mt-1 text-lg font-medium text-foreground">
                {b.judul}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.ringkasan}
              </p>
            </li>
          ))}
        </ul>
      </Bagian>
    </HalamanInfo>
  )
}
