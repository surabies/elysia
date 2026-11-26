import type { Metadata } from "next"
import { Calendar, ChevronRight, Newspaper, Tag, User } from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import {
  pengaturanService,
  DEFAULT_BERITA_PENGUMUMAN,
  DEFAULT_PROFIL_PERUSAHAAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Berita & Pengumuman Resmi" }
export const dynamic = "force-dynamic"

export default async function BeritaPage() {
  const [data, profil] = await Promise.all([
    pengaturanService.getPengaturan("berita_pengumuman", DEFAULT_BERITA_PENGUMUMAN),
    pengaturanService.getPengaturan("profil_perusahaan", DEFAULT_PROFIL_PERUSAHAAN),
  ])

  const daftar = data.daftarBerita || []
  const beritaUtama = daftar[0]
  const beritaLainnya = daftar.slice(1)

  return (
    <HalamanInfo
      judul="Berita & Pengumuman Resmi"
      deskripsi={`Pusat publikasi kabar terkini, siaran pers, dan pengumuman operasional resmi ${profil.nama}.`}
    >
      {/* 1. BERITA UTAMA / SPOTLIGHT */}
      {beritaUtama && (
        <div className="motion-card-interactive gradient-card-water group rounded-2xl border border-blue-200/70 p-6 sm:p-8 dark:border-blue-900/40 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-mono font-bold text-white uppercase tracking-wider">
              Sorotan Utama
            </span>
            {beritaUtama.tag && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                {beritaUtama.tag}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <Calendar className="size-3" />
              <span>{beritaUtama.tanggal}</span>
            </span>
            {beritaUtama.penulis && (
              <span className="text-xs text-muted-foreground">
                • {beritaUtama.penulis}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug transition-colors group-hover:text-primary">
              {beritaUtama.judul}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-4xl">
              {beritaUtama.ringkasan}
            </p>
          </div>
        </div>
      )}

      {/* 2. DAFTAR BERITA LAINNYA */}
      {beritaLainnya.length > 0 && (
        <Bagian
          judul="Arsip Publikasi &amp; Pengumuman Terkini"
          subjudul="Rangkuman kabar seputar perkembangan layanan, program subsidi, dan infrastruktur air minum."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {beritaLainnya.map((b, idx) => (
              <article
                key={b.slug || idx}
                className="motion-card-interactive gradient-card-subtle group flex flex-col justify-between rounded-xl border border-border p-5 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      {b.tag || "Pengumuman"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="size-3" />
                      {b.tanggal}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 transition-colors group-hover:text-primary">
                      {b.judul}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {b.ringkasan}
                    </p>
                  </div>
                </div>

                {b.penulis && (
                  <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      <span>{b.penulis}</span>
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </Bagian>
      )}
    </HalamanInfo>
  )
}
