// src/components/layout/page/MenuPage.tsx
//
// Halaman TEMPLATE untuk menu yang modulnya belum dibangun.
// Satu komponen ini dipakai banyak route: cukup kirim `href` menu-nya, judul
// dan breadcrumb diambil otomatis dari `config/Navigasi.ts`.
//
// Contoh pemakaian (app/(dashboard)/jaringan/aset/page.tsx):
//
//   export default function Page() {
//     return <MenuPage href="/jaringan/aset" />
//   }
//
// Jika `href` tidak terdaftar di menu, akan tampil halaman 404.
//
// Saat modul sudah siap, JANGAN edit file ini. Buat halaman sungguhan di
// route-nya dan ganti pemakaian <MenuPage /> di route tersebut.

import { notFound } from "next/navigation"

import { findNavItem } from "@/config/navigasi"
import { PageContainer } from "./PageContainer"

// Label kartu ringkasan placeholder. Ubah di sini jika ingin mengganti isi.
const SUMMARY_LABELS = ["Total", "Hari ini", "Menunggu tindakan"] as const

export function MenuPage({
  href,
  className,
}: {
  href: string
  className?: string
}) {
  const found = findNavItem(href)
  if (!found) notFound() // notFound() bertipe `never`, jadi `found` aman di bawah

  // group : Direktorat tempat halaman berada
  // item  : halaman yang sedang dibuka
  const { item } = found

  return (
    <PageContainer className={className}>
      {/* Banner status pengembangan */}
      <div className="mb-6 rounded-lg border border-(--ds-blue-300) bg-(--ds-blue-100) p-4 text-copy-13 text-(--ds-blue-900) sm:mb-6 sm:p-5 dark:border-(--ds-blue-400) dark:bg-(--ds-blue-100) dark:text-(--ds-blue-900)">
        <p className="text-label-14 font-semibold">Halaman dalam tahap pengembangan</p>
        <p className="mt-1 text-copy-13">
          Kerangka modul sudah tersedia. Konten dan integrasi data akan
          ditambahkan pada tahap berikutnya.
        </p>
      </div>

      {/* Kartu ringkasan (placeholder; "—" = data belum tersedia) */}
      <section aria-label={`Ringkasan ${item.title}`}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SUMMARY_LABELS.map((label) => (
            <div
              key={label}
              className="min-w-0 rounded-lg border border-border bg-card p-5"
            >
              <p className="text-label-13 text-muted-foreground">{label}</p>
              <p className="mt-2 font-mono text-heading-24 tabular-nums">&mdash;</p>
            </div>
          ))}
        </div>
      </section>

      {/* Area data (placeholder; ganti dengan tabel/grafik modul) */}
      <section className="mt-5 rounded-lg border border-border bg-card p-5 sm:mt-6">
        <h2 className="text-heading-16 text-foreground">Data {item.title}</h2>
        <p className="mt-1 text-copy-13 text-muted-foreground">
          Data untuk modul ini akan ditampilkan di sini.
        </p>
        <div
          aria-hidden="true"
          className="mt-4 h-48 rounded-md border border-dashed border-border bg-(--ds-gray-100) sm:h-64"
        />
      </section>
    </PageContainer>
  )
}
