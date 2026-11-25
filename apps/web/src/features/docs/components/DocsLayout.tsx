"use client"

import * as React from "react"
import Link from "next/link"
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocsSidebar } from "./DocsSidebar"
import { DocsTableOfContents } from "./DocsTableOfContents"
import type { DocCategory, DocItemMeta } from "../types"

interface DocsLayoutProps {
  categories: DocCategory[]
  currentDoc: DocItemMeta
  prevDoc?: { slug: string; title: string }
  nextDoc?: { slug: string; title: string }
  children: React.ReactNode
}

export function DocsLayout({
  categories,
  currentDoc,
  prevDoc,
  nextDoc,
  children,
}: DocsLayoutProps) {
  return (
    <div className="w-full bg-background min-h-screen">
      <div className="w-full px-6 lg:px-8">
        <div className="flex w-full items-start justify-between">
          {/* Kolom Kiri: Sidebar Pinned dengan Garis Gradien Memudar */}
          <DocsSidebar categories={categories} activeSlug={currentDoc.slug} />

          {/* Kolom Tengah: Konten Dokumen CENTERED di antara Sidebar dan TOC */}
          <main className="flex-1 min-w-0 flex flex-col items-center px-4 py-8 lg:px-8 pb-24">
            <div className="w-full max-w-[42rem] mx-auto space-y-6">
              {/* Header Artikel (Tanpa Breadcrumb) */}
              <div className="space-y-2 border-b border-border pb-6 mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h1 className="scroll-m-24 text-3xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {currentDoc.title}
                  </h1>

                  {currentDoc.routeRef && (
                    <Link href={currentDoc.routeRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 text-xs bg-card hover:bg-muted shadow-none"
                      >
                        <span>Buka Halaman Langsung</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  )}
                </div>

                <p className="text-[1.05rem] text-muted-foreground sm:text-base leading-relaxed">
                  {currentDoc.description}
                </p>
              </div>

              {/* Body Konten */}
              <div className="docs-content text-[15px] leading-7 text-foreground/90 space-y-8">
                {children}
              </div>

              {/* Pager Navigasi Sebelumnya / Selanjutnya */}
              {(prevDoc || nextDoc) && (
                <div className="mt-14 pt-6 border-t border-border flex items-center justify-between gap-4">
                  {prevDoc ? (
                    <Link href={`/docs/${prevDoc.slug}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs shadow-none hover:bg-muted"
                      >
                        <ChevronLeft className="size-3.5" />
                        <span>{prevDoc.title}</span>
                      </Button>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextDoc && (
                    <Link href={`/docs/${nextDoc.slug}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs shadow-none hover:bg-muted ml-auto"
                      >
                        <span>{nextDoc.title}</span>
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* Kolom Kanan: On this page (TOC) Pinned */}
          <DocsTableOfContents headings={currentDoc.headings} />
        </div>
      </div>
    </div>
  )
}
