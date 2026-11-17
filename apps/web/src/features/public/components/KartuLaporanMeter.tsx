import { ImageIcon, Calendar, CheckCircle2, Clock, AlertCircle } from "@/components/ui/hugeicons-compat"
import { BingkaiFoto } from "@/components/BingkaiFoto"
import type { DetailLaporanBulanIni } from "../lib/api"
import {
  formatPeriode,
  formatWaktu,
  statusLaporanMandiriWarga,
} from "../lib/format"
import { cn } from "@/lib/utils"

export function KartuLaporanMeter({
  laporan,
}: {
  laporan: DetailLaporanBulanIni
}) {
  const status = statusLaporanMandiriWarga(laporan.status)
  const periodeLabel = formatPeriode(laporan.periode)

  return (
    <div aria-label={`Laporan meter periode ${periodeLabel}`} className="space-y-5">
      {/* Header Status (Tanpa nested card) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-blue-600 dark:text-sky-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Periode {periodeLabel}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Dikirim {formatWaktu(laporan.createdAt)} WIB
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-semibold shadow-2xs",
              status.badgeClass
            )}
          >
            <span className={cn("size-2 rounded-full", status.dotClass)} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Alasan penolakan tampil ke warga jika ditolak */}
      {laporan.status === "DITOLAK" && laporan.alasanDitolak && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Laporan Ditolak Petugas:</p>
            <p className="mt-0.5">{laporan.alasanDitolak}</p>
            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
              Silakan foto ulang meteran dengan jelas dan kirim kembali lewat tab Lapor Meter.
            </p>
          </div>
        </div>
      )}

      {/* Metrik Stand Meter */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/50 p-3.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Stand Dilaporkan
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-foreground">
            {laporan.standDilaporkan.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-muted-foreground">m³</span>
          </p>
        </div>

        {laporan.pemakaianM3 !== null ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <p className="text-[10px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-300 uppercase">
              Pemakaian Resmi
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-900 dark:text-emerald-200">
              {laporan.pemakaianM3.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300">m³</span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/50 p-3.5">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Pemakaian Resmi
            </p>
            <p className="mt-1 text-xs text-muted-foreground italic">
              Menunggu verifikasi
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/50 p-3.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Status Verifikasi
          </p>
          <p className="mt-1 text-xs text-foreground">
            {laporan.verifiedAt ? (
              <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {formatWaktu(laporan.verifiedAt)} WIB
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                <Clock className="size-3.5" /> Antrean Petugas
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Foto Meter */}
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ImageIcon className="size-4 text-blue-600 dark:text-sky-400" />
          Foto Stand Meter yang Dikirim
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-xs">
          <BingkaiFoto
            src={laporan.fotoUrl}
            alt={`Foto stand meter periode ${periodeLabel}`}
            mode="utuh"
            rasio="16/9"
          />
        </div>
      </div>
    </div>
  )
}
