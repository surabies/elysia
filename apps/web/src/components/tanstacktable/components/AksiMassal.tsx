"use client"

// features/dashboard/verifikasi/components/AksiMassal.tsx — bilah aksi
// untuk baris terpilih, plus pintasan papan ketik.
//
// KENAPA MUNCUL-HILANG, BUKAN SELALU ADA. Bilah ini hanya berarti kalau ada
// yang dipilih; menampilkannya kosong sepanjang waktu memakan tinggi layar
// yang lebih berguna untuk baris. Ia menempel di bawah tabel supaya jempol
// tidak perlu naik ke atas layar setelah memilih.
//
// PENGAMAN YANG DIJAGA: aksi massal SELALU meminta konfirmasi yang menyebut
// JUMLAH dan RING-nya. "Verifikasi 4.812 baris ke V3" harus terbaca sebelum
// ditekan, karena V3 menerbitkan pembacaan resmi dan membatalkannya jauh
// lebih mahal daripada mengulang klik.

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  CheckCheck,
  Download,
  Keyboard,
  Loader2,
  ShieldCheck,
  X,
} from "@/components/ui/hugeicons-compat"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type Ring = 1 | 2 | 3

const RING_INFO: Record<
  Ring,
  { label: string; pintasan: string; jelas: string; kelasTombol: string }
> = {
  1: {
    label: "V1 Periksa",
    pintasan: "F1",
    jelas:
      "Menandai baris sudah diperiksa supervisor. Meter tujuan diisi otomatis dari meter aktif pelanggan.",
    kelasTombol:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300",
  },
  2: {
    label: "V2 Validasi",
    pintasan: "F2",
    jelas: "Validasi manajemen. Hanya baris yang sudah lolos V1.",
    kelasTombol:
      "border-blue-500/30 bg-blue-500/10 text-blue-800 hover:bg-blue-500/20 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-300",
  },
  3: {
    label: "V3 Resmi",
    pintasan: "F3",
    jelas:
      "Persetujuan final — MENERBITKAN pembacaan meter resmi. Hanya baris yang sudah lolos V1 dan V2.",
    kelasTombol:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
};

export function AksiMassal({
  jumlah,
  bolehRing,
  onJalankan,
  onBersihkan,
  onEkspor,
  sedangJalan,
  kemajuan,
}: {
  jumlah: number
  /// Ring mana yang boleh ditekan pengguna ini — cermin RBAC server.
  bolehRing: (r: Ring) => boolean
  onJalankan: (ring: Ring, sertakanAnomali: boolean) => void
  onBersihkan: () => void
  onEkspor: () => void
  sedangJalan: boolean
  kemajuan: { selesai: number; total: number } | null
}) {
  const [konfirmasi, setKonfirmasi] = React.useState<Ring | null>(null)
  const [sertakanAnomali, setSertakanAnomali] = React.useState(false)

  // Pintasan papan ketik. Sengaja TIDAK langsung menjalankan: F1/F2/F3
  // membuka dialog konfirmasi yang sama dengan tombolnya. Pintasan
  // mempercepat menjangkau, bukan melewati pemeriksaan.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return
      const peta: Record<string, Ring> = { F1: 1, F2: 2, F3: 3 }
      const ring = peta[e.key]
      if (ring && jumlah > 0 && bolehRing(ring)) {
        e.preventDefault()
        setKonfirmasi(ring)
      }
      if (e.key === "Escape" && jumlah > 0) onBersihkan()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [jumlah, bolehRing, onBersihkan])

  if (jumlah === 0 && !sedangJalan) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5 shadow-xs">
        <Badge
          variant="pill"
          size="lg"
          className="h-8 rounded-md px-3 font-mono text-label-12 font-medium text-foreground border-border"
        >
          <span className="font-semibold text-foreground">
            {jumlah.toLocaleString("id-ID")}
          </span>{" "}
          baris dipilih
        </Badge>

        {sedangJalan && kemajuan ? (
          <span className="flex items-center gap-2 text-label-12 text-muted-foreground tabular-nums">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {kemajuan.selesai.toLocaleString("id-ID")} /{" "}
            {kemajuan.total.toLocaleString("id-ID")} diproses…
          </span>
        ) : (
          <>
            {([1, 2, 3] as const).map((r) => (
              <Tooltip key={r}>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="default"
                      variant="outline"
                      className={cn(RING_INFO[r].kelasTombol, "h-8 rounded-md text-label-12")}
                      disabled={!bolehRing(r)}
                      onClick={() => setKonfirmasi(r)}
                    >
                      {r === 3 ? (
                        <ShieldCheck className="size-3.5" aria-hidden />
                      ) : (
                        <CheckCheck className="size-3.5" aria-hidden />
                      )}
                      {RING_INFO[r].label}
                      <kbd className="ml-1 rounded border border-border/60 bg-background/80 px-1 py-0.5 text-label-11 font-mono text-current opacity-90">
                        {RING_INFO[r].pintasan}
                      </kbd>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">
                  {bolehRing(r)
                    ? RING_INFO[r].jelas
                    : "Role Anda tidak berwenang untuk ring ini."}
                </TooltipContent>
              </Tooltip>
            ))}

            <Button
              size="default"
              variant="outline"
              className="h-8 rounded-md gap-1.5 text-label-12 font-medium border-border"
              onClick={onEkspor}
            >
              <Download className="size-3.5" aria-hidden /> Ekspor terpilih
            </Button>
            <Button
              size="default"
              variant="ghost"
              className="h-8 rounded-md gap-1.5 text-label-12 text-muted-foreground hover:text-foreground"
              onClick={onBersihkan}
            >
              <X className="size-3.5" aria-hidden /> Batal pilih
              <kbd className="ml-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-label-11 text-muted-foreground font-mono">
                Esc
              </kbd>
            </Button>
          </>
        )}

        <span className="ml-auto hidden items-center gap-1.5 text-label-12 text-muted-foreground lg:flex">
          <Keyboard className="size-3.5" aria-hidden />{" "}
          <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-label-11 font-mono">
            Ctrl+A
          </kbd>{" "}
          pilih semua ·{" "}
          <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-label-11 font-mono">
            Shift+klik
          </kbd>{" "}
          pilih rentang
        </span>
      </div>

      <AlertDialog
        open={konfirmasi !== null}
        onOpenChange={(b) => {
          if (!b) setKonfirmasi(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Verifikasi {jumlah.toLocaleString("id-ID")} baris ke{" "}
              {konfirmasi ? RING_INFO[konfirmasi].label : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi ? RING_INFO[konfirmasi].jelas : ""}
              {konfirmasi === 3 && (
                <span className="mt-2 block font-medium">
                  V3 menerbitkan pembacaan meter resmi yang jadi dasar
                  penagihan. Membatalkannya jauh lebih mahal daripada mengulang
                  langkah ini.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Anomali: bawaannya DILEWATI. Pengguna harus menyatakan niatnya
              secara sadar — kotak ini sengaja tidak tercentang. */}
          <label className="flex items-start gap-2 text-copy-13">
            <Checkbox
              checked={sertakanAnomali}
              onCheckedChange={(v) => setSertakanAnomali(v === true)}
              className="mt-0.5"
            />
            <span>
              Ikutkan baris anomali.
              <span className="block text-muted-foreground">
                Tanpa ini, baris di luar ambang penyimpangan dilewati dan
                dilaporkan — supaya &ldquo;verifikasi semua&rdquo; tidak pernah
                berarti meloloskan yang mencurigakan tanpa dilihat.
              </span>
            </span>
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (konfirmasi) onJalankan(konfirmasi, sertakanAnomali)
                setKonfirmasi(null)
              }}
            >
              Ya, jalankan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
