import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  DocsLayout,
  docCategories,
  getDocMeta,
  getDocComponent,
  getAllDocSlugs,
} from "@/features/docs"

interface DocsSlugPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: DocsSlugPageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = getDocMeta(slug)

  if (!doc) {
    return {
      title: "Dokumentasi Tidak Ditemukan | M2C Tirtawening",
    }
  }

  return {
    title: `${doc.title} — Dokumentasi | M2C Tirtawening`,
    description: doc.description,
  }
}

export default async function DocsSlugPage({ params }: DocsSlugPageProps) {
  const { slug } = await params
  const doc = getDocMeta(slug)

  if (!doc) {
    notFound()
  }

  const allSlugs = getAllDocSlugs()
  const currentIndex = allSlugs.indexOf(slug)
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : undefined
  const nextSlug =
    currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : undefined

  const prevDoc = prevSlug ? getDocMeta(prevSlug) : undefined
  const nextDoc = nextSlug ? getDocMeta(nextSlug) : undefined

  const ContentComponent = getDocComponent(slug)

  return (
    <DocsLayout
      categories={docCategories}
      currentDoc={doc}
      prevDoc={prevDoc ? { slug: prevDoc.slug, title: prevDoc.title } : undefined}
      nextDoc={nextDoc ? { slug: nextDoc.slug, title: nextDoc.title } : undefined}
    >
      <ContentComponent meta={doc} />
    </DocsLayout>
  )
}
