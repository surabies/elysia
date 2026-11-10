// lib/DataPencarian.ts
// Pencarian menu cepat (Ctrl+K) dengan indeks menyeluruh dari Navigasi.ts.

import {
  navGroups,
  primaryNav,
  flattenNavItems,
  type NavGroup,
  type NavItem,
} from "@/config/navigasi";

export type SearchResult = { page: string; title: string; href: string };
export type SearchGroup = { category: string; results: SearchResult[] };

export function searchDocs(
  query: string,
  sourceGroups: readonly NavGroup[] = navGroups,
  sourcePrimary: readonly NavItem[] = primaryNav
): SearchGroup[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const groups: SearchGroup[] = [];

  // 1. Cari pada modul mandiri (Primary Nav)
  const primaryResults: SearchResult[] = sourcePrimary
    .filter((item: NavItem) => {
      const text = `${item.title} ${item.description || ""} ${(item.keywords || []).join(" ")}`.toLowerCase();
      return terms.every((t) => text.includes(t));
    })
    .map((item: NavItem) => ({
      page: item.title,
      title: item.description || "",
      href: item.href,
    }));

  if (primaryResults.length > 0) {
    groups.push({ category: "Menu Utama", results: primaryResults });
  }

  // 2. Cari pada kelompok tematik
  for (const group of sourceGroups) {
    const items = flattenNavItems(group.items);

    const pageResults: SearchResult[] = items
      .filter((item: NavItem) => {
        const text = `${item.title} ${item.description || ""} ${(item.keywords || []).join(" ")}`.toLowerCase();
        return terms.every((t) => text.includes(t));
      })
      .map((item: NavItem) => ({
        page: item.title,
        title: item.description || "",
        href: item.href,
      }));

    if (pageResults.length > 0) {
      groups.push({ category: group.title, results: pageResults });
    }
  }

  return groups;
}
