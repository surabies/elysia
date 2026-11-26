import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, FileCheck, Info, MapPin, Wrench } from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"
import {
  pengaturanService,
  DEFAULT_SYARAT_PASANG_BARU,
  DEFAULT_PROFIL_PERUSAHAAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Pasang Baru Sambungan Air Minum" }
export const dynamic = "force-dynamic"

export default async function PasangBaruPage() {
  const [syarat, profil] = await Promise.all([
    pengaturanService.getPengaturan("syarat_pasang_baru", DEFAULT_SYARAT_PASANG_BARU),
    pengaturanService.getPengaturan("profil_perusahaan", DEFAULT_PROFIL_PERUSAHAAN),
  ])

  return (
    <HalamanInfo
      judul={syarat.judul || "Pasang Baru Sambungan Air Minum"}
      deskripsi={
        syarat.deskripsi ||
        `Prosedur, persyaratan berkas, dan tahapan resmi pemasangan sambungan air perpipaan baru ${profil.nama}.`
      }
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kolom Kiri: Persyaratan Dokumen & Biaya Teknis (5 kolom) */}
        <div className="space-y-6 lg:col-span-5">
          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <FileCheck className="size-4.5" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Persyaratan Berkas Dokumen
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Pastikan berkas berikut telah dipersiapkan sebelum mengajukan formulir di kantor pelayanan wilayah:
            </p>
            <ul className="space-y-3 pt-1">
              {syarat.syaratDokumen.map((s, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground transition-colors hover:text-primary"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5 transition-transform group-hover:scale-110" />
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {syarat.catatanPenting && (
            <div className="motion-card-interactive gradient-card-water group rounded-xl border border-blue-200/70 p-4 sm:p-5 dark:border-blue-900/40 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <Info className="size-4 shrink-0 transition-transform duration-200 group-hover:rotate-12" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Ketentuan Jarak Pipa Retikulasi
                </h3>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {syarat.catatanPenting}
              </p>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Alur Tahapan Pemasangan (7 kolom) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Wrench className="size-4.5" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Alur &amp; Tahapan Pelaksanaan Pemasangan
              </h2>
            </div>

            <div className="relative border-l border-border/80 ml-3.5 space-y-6 pl-5">
              {syarat.alurTahapan.map((a, idx) => (
                <div key={idx} className="relative group/step">
                  <span className="absolute -left-[29px] top-0.5 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground ring-4 ring-background transition-transform duration-200 group-hover/step:scale-120">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground transition-colors group-hover/step:text-primary">
                      {a.judul}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {a.isi}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Bantuan Lokasi Kantor */}
          <div className="motion-card-interactive gradient-card-subtle rounded-xl border border-border/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                Ingin Mengunjungi Kantor Pelayanan Terdekat?
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cek alamat lengkap dan jam buka kantor pelayanan wilayah Kota Bandung.
              </p>
            </div>
            <Link
              href={RUTE.kontak}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-all hover:scale-102"
            >
              Lihat Kantor Cabang →
            </Link>
          </div>
        </div>
      </div>
    </HalamanInfo>
  )
}
