// features/public/components/KartuLaporanMeter.tsx — tampilan lengkap
// laporan meter mandiri periode BERJALAN untuk pelapor: status verifikasi,
// angka yang dilaporkan, pemakaian resmi (begitu tersedia), dan foto
// buktinya sendiri.
//
// Sengaja HANYA periode berjalan (bukan daftar riwayat semua periode) —
// permintaan produk: warga hanya perlu tahu status laporan bulan ini, bukan
// diarsipkan menggulung riwayat lama. Lihat cek-laporan-meter-form.tsx.
//
// Pola sama dengan kartu-tiket.tsx (pelacakan pengaduan): semua penilaian
// ("sudah diverifikasi?", "berapa pemakaiannya?") datang JADI dari server,
// komponen ini tidak menghitung ulang apa pun.
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-blue-600 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
              Periode {periodeLabel}
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
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
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700">
          <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Laporan Ditolak Petugas:</p>
            <p className="mt-0.5">{laporan.alasanDitolak}</p>
            <p className="mt-1 text-[11px] text-red-600">
              Silakan foto ulang meteran dengan jelas dan kirim kembali lewat tab Lapor Meter.
            </p>
          </div>
        </div>
      )}

      {/* Metrik Stand Meter */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5">
          <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
            Stand Dilaporkan
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-neutral-900">
            {laporan.standDilaporkan.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-neutral-500">m³</span>
          </p>
        </div>

        {laporan.pemakaianM3 !== null ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/50 p-3.5">
            <p className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
              Pemakaian Resmi
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-900">
              {laporan.pemakaianM3.toLocaleString("id-ID")}{" "}
              <span className="text-xs font-normal text-emerald-700">m³</span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5">
            <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
              Pemakaian Resmi
            </p>
            <p className="mt-1 text-xs text-neutral-400 italic">
              Menunggu verifikasi
            </p>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5">
          <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
            Status Verifikasi
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            {laporan.verifiedAt ? (
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {formatWaktu(laporan.verifiedAt)} WIB
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <Clock className="size-3.5" /> Antrean Petugas
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Foto Meter */}
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <ImageIcon className="size-4 text-blue-600" />
          Foto Stand Meter yang Dikirim
        </p>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-xs">
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
