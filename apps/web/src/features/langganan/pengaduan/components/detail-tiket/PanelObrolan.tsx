"use client"

// features/dashboard/pengaduan/components/detail-tiket/PanelObrolan.tsx — chat
// dua arah dengan pelapor. SELALU publik: tampil sebagai percakapan di
// halaman pelacakan warga & app mobile.
import * as React from "react"
import { Send, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { kirimJson } from "@/lib/api-dashboard"
import { PanelKartu } from "@/features/dashboard/pengaduan/components/bersama/PanelKartu"
import type { PengaduanDetail } from "@/features/dashboard/pengaduan/types/TipePengaduan"
import type { JalankanAksi } from "../../hooks/UseRincianTiket"

const TEMPLATE_BALASAN_CEPAT = [
  "Laporan diterima. Petugas teknisi sedang menuju ke lokasi.",
  "Sedang dilakukan pengecekan tekanan pipa jaringan di sekitar lokasi.",
  "Pekerjaan perbaikan fisik selesai, mohon periksa apakah air sudah mengalir lancar.",
  "Petugas membutuhkan info patokan alamat rumah yang lebih spesifik.",
]

export function PanelChat({
  detail,
  mengirim,
  jalankan,
}: {
  detail: PengaduanDetail
  mengirim: boolean
  jalankan: JalankanAksi
}) {
  const [pesan, setPesan] = React.useState("")
  const pesanBersih = pesan.trim()

  async function kirim(teksKirim?: string) {
    const isi = (teksKirim ?? pesanBersih).trim()
    if (!isi || mengirim) return
    const sukses = await jalankan(() =>
      kirimJson(`/pengaduan/${detail.id}/chat`, "POST", { pesan: isi })
    )
    if (sukses && !teksKirim) setPesan("")
  }

  function tanganiKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault()
      void kirim()
    }
  }

  return (
    <PanelKartu judul="Chat Obrolan dengan Pelapor">
      <div className="flex flex-col gap-3">
        {/* Banner Status Akses Publik Enterprise */}
        <div className="flex items-center justify-between rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Eye className="size-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Kanal Obrolan Publik 2 Arah</span>
          </div>
          <Badge
            variant="outline"
            className="border-sky-500/30 bg-sky-500/15 text-[10px] text-sky-700 dark:text-sky-300"
          >
            Dilihat Pelapor
          </Badge>
        </div>

        {/* Input Textarea Composer */}
        <div className="relative rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
          <Textarea
            rows={2}
            className="w-full resize-none border-0 bg-transparent p-3 text-xs focus-visible:ring-0 focus-visible:outline-none placeholder:text-muted-foreground"
            placeholder="Tulis pesan atau jawaban untuk pelapor (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)…"
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            disabled={mengirim}
            onKeyDown={tanganiKeyDown}
          />
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-3 py-2 text-[11px]">
            <span className="text-[10.5px] text-muted-foreground">
              Tekan <kbd className="rounded border bg-muted px-1 font-mono text-[9.5px]">Enter</kbd> untuk kirim
            </span>
            <Button
              size="sm"
              disabled={mengirim || !pesanBersih}
              onClick={() => void kirim()}
              className="h-7 gap-1.5 px-3 text-xs font-semibold shadow-2xs"
            >
              <Send className="size-3" />
              Kirim Balasan
            </Button>
          </div>
        </div>

        {/* Template Respon Cepat (Canned Responses) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="size-3 text-amber-500" />
            <span>Balasan Cepat:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_BALASAN_CEPAT.map((template, idx) => (
              <button
                key={idx}
                type="button"
                disabled={mengirim}
                onClick={() => setPesan(template)}
                className="rounded-md border border-border/80 bg-muted/40 hover:bg-muted px-2 py-1 text-[10.5px] text-muted-foreground hover:text-foreground text-left transition-colors max-w-full truncate"
                title={template}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PanelKartu>
  )
}
