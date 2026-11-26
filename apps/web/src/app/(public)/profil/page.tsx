import type { Metadata } from "next"
import { Building2, Compass, History, ShieldCheck, Target } from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import {
  pengaturanService,
  DEFAULT_PROFIL_PERUSAHAAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Profil Perusahaan" }
export const dynamic = "force-dynamic"

export default async function ProfilPerusahaanPage() {
  const profil = await pengaturanService.getPengaturan(
    "profil_perusahaan",
    DEFAULT_PROFIL_PERUSAHAAN
  )

  return (
    <HalamanInfo
      judul={profil.nama}
      deskripsi={`Badan Usaha Milik Daerah (BUMD) pengelola air minum perpipaan dan sanitasi berkelanjutan ${profil.tagline ? `— ${profil.tagline}` : ""}`}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Tentang Kami & Sejarah (7 kolom) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Building2 className="size-4.5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Tentang Kami
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {profil.tentang}
            </p>
          </div>

          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <History className="size-4.5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Sejarah Singkat Perusahaan
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {profil.sejarah}
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Visi & Poin Misi (5 kolom) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card Visi */}
          <div className="motion-card-interactive gradient-card-water group rounded-xl border border-blue-200/70 p-5 sm:p-6 dark:border-blue-900/40 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Compass className="size-4.5 shrink-0 transition-transform duration-300 group-hover:rotate-45" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                Visi Perusahaan
              </span>
            </div>
            <blockquote className="text-base sm:text-lg font-semibold text-foreground leading-snug">
              &ldquo;{profil.visi}&rdquo;
            </blockquote>
          </div>

          {/* Card Misi */}
          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Target className="size-4.5" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Misi Strategis
              </h2>
            </div>
            <ol className="space-y-3">
              {profil.misi.map((m, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold text-foreground mt-0.5 transition-colors duration-200 group-hover:bg-primary/20">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nilai Integritas */}
          <div className="motion-card-interactive gradient-card-subtle rounded-xl border border-border/70 p-4 flex items-center gap-3 text-xs text-muted-foreground shadow-2xs">
            <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
            <span>
              Menerapkan prinsip Good Corporate Governance (GCG) untuk menjamin transparansi, akuntabilitas, dan pelayanan prima.
            </span>
          </div>
        </div>
      </div>
    </HalamanInfo>
  )
}
