// lib/DataPencarian.ts
// Tugas: sumber data pencarian (Ctrl+K). Dibangun dari config/Navigasi.ts,
// mendukung filtering RBAC berdasarkan role yang sedang aktif.
import { navGroups, type NavGroup, type NavItem } from "@/config/Navigasi"

export type SearchResult = { page: string; title: string; href: string }
export type SearchGroup = { category: string; results: SearchResult[] }

export function searchDocs(
  query: string,
  sourceGroups: readonly NavGroup[] = navGroups
): SearchGroup[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const groups: SearchGroup[] = []

  for (const group of sourceGroups) {
    const items = "items" in group ? group.items : []

    const pageResults: SearchResult[] = items
      .filter(
        (entry): entry is NavItem => "href" in entry && entry.href !== undefined
      )
      .filter((item) => {
        const text = `${item.title} ${item.description || ""} ${(item.keywords || []).join(" ")}`.toLowerCase()
        return terms.every((t) => text.includes(t))
      })
      .map((item) => ({
        page: item.title,
        title: item.description!,
        href: item.href,
      }))

    if (pageResults.length > 0)
      groups.push({ category: group.title, results: pageResults })
  }

  return groups
}
