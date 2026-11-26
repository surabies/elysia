import type { ComponentType } from "react"
import { navGroups, type NavItem } from "@/config/navigasi"
import type { DocCategory, DocItemMeta, DocHeading } from "../types"
import {
  KpiInsentifDoc,
  kpiInsentifHeadings,
} from "../content/KpiInsentifDoc"
import {
  GeotaggingTitikGpsDoc,
  geotaggingTitikGpsHeadings,
} from "../content/GeotaggingTitikGpsDoc"
import {
  VerifikasiLapanganDoc,
  verifikasiLapanganHeadings,
} from "../content/VerifikasiLapanganDoc"
import {
  VerifikasiMandiriDoc,
  verifikasiMandiriHeadings,
} from "../content/VerifikasiMandiriDoc"
import { DocsDynamicPageContent } from "../components/DocsDynamicPageContent"

export function hrefToSlug(href: string): string {
  return href.replace(/^\//, "").replace(/\//g, "-").replace(/[?=&]/g, "-") || "index"
}

const DEFAULT_PAGE_HEADINGS: DocHeading[] = [
  { id: "ikhtisar", title: "Ikhtisar & Tujuan Halaman", level: 2 },
  { id: "akses", title: "Peran & Hak Akses Pengguna", level: 2 },
  { id: "panduan-langkah", title: "Panduan Langkah demi Langkah", level: 2 },
  { id: "faq", title: "Pertanyaan Umum (FAQ)", level: 2 },
]

// ----------------------------------------------------------------------------
// 1. GENERATE DOKUMENTASI METADATA LANGSUNG DARI NAVGROUPS (100% MATCH DASHBOARD)
// ----------------------------------------------------------------------------
function buildRegistry(): {
  categories: DocCategory[]
  metas: Record<string, DocItemMeta>
} {
  const categories: DocCategory[] = []
  const metas: Record<string, DocItemMeta> = {}

  for (const group of navGroups) {
    const categoryItems: DocCategory["items"] = []

    for (const rawItem of group.items) {
      if (!("href" in rawItem)) continue
      const item = rawItem as NavItem
      const slug = hrefToSlug(item.href)

      const isKpi = slug === "kpi"
      const isTitikGps = slug === "pelanggan-titik-gps"
      const isVerifPetugas = slug === "verifikasi-baca-petugas"
      const isVerifMandiri = slug === "verifikasi-baca-pelanggan"
      const meta: DocItemMeta = {
        slug,
        title: item.title,
        category: group.id,
        categoryTitle: group.title,
        description: item.description,
        lastUpdated: "26 November 2026",
        badge: isKpi
          ? "Update"
          : isTitikGps
          ? "Akurasi Tinggi"
          : isVerifPetugas || isVerifMandiri
          ? "Guide Book"
          : undefined,
        routeRef: item.href,
        roles: item.roles,
        keywords: item.keywords,
        headings: isKpi
          ? kpiInsentifHeadings
          : isTitikGps
          ? geotaggingTitikGpsHeadings
          : isVerifPetugas
          ? verifikasiLapanganHeadings
          : isVerifMandiri
          ? verifikasiMandiriHeadings
          : DEFAULT_PAGE_HEADINGS,
      }

      metas[slug] = meta
      categoryItems.push({
        slug,
        title: item.title,
        description: item.description,
        badge: meta.badge,
        routeRef: item.href,
      })
    }

    if (categoryItems.length > 0) {
      categories.push({
        id: group.id,
        title: group.title,
        items: categoryItems,
      })
    }
  }

  // Alias untuk kompatibilitas tautan lama / alternatif
  if (metas["kpi"]) {
    metas["kpi-insentif"] = {
      ...metas["kpi"],
      slug: "kpi-insentif",
    }
  }

  if (metas["pelanggan-titik-gps"]) {
    metas["titik-gps"] = {
      ...metas["pelanggan-titik-gps"],
      slug: "titik-gps",
    }
  }

  if (metas["verifikasi-baca-petugas"]) {
    metas["verifikasi-lapangan"] = {
      ...metas["verifikasi-baca-petugas"],
      slug: "verifikasi-lapangan",
    }
  }

  if (metas["verifikasi-baca-pelanggan"]) {
    metas["verifikasi-mandiri"] = {
      ...metas["verifikasi-baca-pelanggan"],
      slug: "verifikasi-mandiri",
    }
  }

  return { categories, metas }
}

const { categories: generatedCategories, metas: generatedMetas } = buildRegistry()

export const docCategories = generatedCategories
export const docMetas = generatedMetas

export function getDocMeta(slug: string): DocItemMeta | undefined {
  if (slug === "kpi-insentif") return docMetas["kpi"] || docMetas["kpi-insentif"]
  if (slug === "titik-gps") return docMetas["pelanggan-titik-gps"] || docMetas["titik-gps"]
  if (slug === "verifikasi-lapangan") return docMetas["verifikasi-baca-petugas"] || docMetas["verifikasi-lapangan"]
  if (slug === "verifikasi-mandiri") return docMetas["verifikasi-baca-pelanggan"] || docMetas["verifikasi-mandiri"]
  return docMetas[slug]
}

export function getAllDocSlugs(): string[] {
  return Object.keys(docMetas)
}

export function getDocComponent(slug: string): ComponentType<{ meta: DocItemMeta }> {
  if (slug === "kpi" || slug === "kpi-insentif") {
    return KpiInsentifDoc as unknown as ComponentType<{ meta: DocItemMeta }>
  }
  if (slug === "pelanggan-titik-gps" || slug === "titik-gps") {
    return GeotaggingTitikGpsDoc as unknown as ComponentType<{ meta: DocItemMeta }>
  }
  if (slug === "verifikasi-baca-petugas" || slug === "verifikasi-lapangan") {
    return VerifikasiLapanganDoc as unknown as ComponentType<{ meta: DocItemMeta }>
  }
  if (slug === "verifikasi-baca-pelanggan" || slug === "verifikasi-mandiri") {
    return VerifikasiMandiriDoc as unknown as ComponentType<{ meta: DocItemMeta }>
  }
  return DocsDynamicPageContent
}
