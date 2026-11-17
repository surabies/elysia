import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  Wrench,
} from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"
import {
  pengaturanService,
  DEFAULT_INFO_GANGGUAN,
  DEFAULT_PROFIL_PERUSAHAAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Info Gangguan & Pemeliharaan Air" }
export const dynamic = "force-dynamic"

export default async function InfoGangguanPage() {
  const [data, profil] = await Promise.all([
    pengaturanService.getPengaturan("info_gangguan", DEFAULT_INFO_GANGGUAN),
    pengaturanService.getPengaturan("profil_perusahaan", DEFAULT_PROFIL_PERUSAHAAN),
  ])

  return (
    <HalamanInfo
      judul="Informasi Gangguan &amp; Pemeliharaan Air"
      deskripsi={`Monitoring status penanganan teknis kebocoran pipa, pemeliharaan berkala, dan normalisasi pasokan air ${profil.nama}.`}
      actions={
        <Link
          href={RUTE.pengaduan}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-all shadow-xs hover:scale-102"
        >
          <AlertCircle className="size-3.5" />
          <span>Laporkan Gangguan Air</span>
        </Link>
      }
    >
      {/* 1. DAFTAR PEKERJAAN & STATUS PENANGANAN */}
      <Bagian
        judul="Jadwal &amp; Status Penanganan Lapangan Terkini"
        subjudul="Informasi wilayah terdampak perbaikan dan estimasi pemulihan aliran air minum."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.daftarGangguan.map((g) => {
            const isSelesai = g.status === "Selesai"
            return (
              <div
                key={g.id}
                className="motion-card-interactive gradient-card-subtle group flex flex-col justify-between rounded-xl border border-border p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        isSelesai
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full bg-current ${
                          !isSelesai ? "animate-pulse" : ""
                        }`}
                      />
                      <span>{g.status}</span>
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      ID: {g.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug flex items-start gap-1.5 transition-colors group-hover:text-primary">
                      <MapPin className="size-4 shrink-0 text-primary mt-1 transition-transform group-hover:scale-110" />
                      <span>{g.wilayah}</span>
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {g.penyebab}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span>Perkiraan Normal: {g.perkiraan}</span>
                  </span>
                  {g.tanggal && <span>{g.tanggal}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Bagian>

      {/* 2. BANNER LAPOR GANGGUAN BARU */}
      <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            Wilayah Anda Mengalami Gangguan yang Belum Tercantum?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Sampaikan laporan gangguan di titik lokasi Anda agar segera diverifikasi oleh tim reaksi cepat lapangan.
          </p>
        </div>
        <Link
          href={RUTE.pengaduan}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs hover:scale-102"
        >
          Buat Laporan Aduan →
        </Link>
      </div>
    </HalamanInfo>
  )
}
