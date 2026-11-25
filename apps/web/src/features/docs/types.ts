export interface DocHeading {
  id: string
  title: string
  level: 2 | 3
}

export interface DocItemMeta {
  slug: string
  title: string
  category: string
  categoryTitle: string
  description: string
  lastUpdated: string
  badge?: string
  routeRef: string
  roles?: string[]
  keywords?: string[]
  headings: DocHeading[]
}

export interface DocCategory {
  id: string
  title: string
  items: {
    slug: string
    title: string
    description?: string
    badge?: string
    routeRef: string
  }[]
}
