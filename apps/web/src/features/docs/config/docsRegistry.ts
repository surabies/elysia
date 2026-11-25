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
      const meta: DocItemMeta = {
        slug,
        title: item.title,
        category: group.id,
        categoryTitle: group.title,
        description: item.description,
        lastUpdated: "25 November 2026",
        badge: isKpi ? "Update" : isTitikGps ? "Akurasi Tinggi" : undefined,
        routeRef: item.href,
        roles: item.roles,
        keywords: item.keywords,
        headings: isKpi
          ? kpiInsentifHeadings
          : isTitikGps
          ? geotaggingTitikGpsHeadings
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

  return { categories, metas }
}

const { categories: generatedCategories, metas: generatedMetas } = buildRegistry()

export const docCategories = generatedCategories
export const docMetas = generatedMetas

export function getDocMeta(slug: string): DocItemMeta | undefined {
  if (slug === "kpi-insentif") return docMetas["kpi"] || docMetas["kpi-insentif"]
  if (slug === "titik-gps") return docMetas["pelanggan-titik-gps"] || docMetas["titik-gps"]
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
  return DocsDynamicPageContent
}
