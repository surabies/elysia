import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  ShieldAlert,
} from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"
import {
  pengaturanService,
  DEFAULT_KONTAK_LAYANAN,
  DEFAULT_PROFIL_PERUSAHAAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Kontak & Kantor Layanan" }
export const dynamic = "force-dynamic"

export default async function KontakPage() {
  const [kontak, profil] = await Promise.all([
    pengaturanService.getPengaturan("kontak_layanan", DEFAULT_KONTAK_LAYANAN),
    pengaturanService.getPengaturan("profil_perusahaan", DEFAULT_PROFIL_PERUSAHAAN),
  ])

  const kartuKontakUtama = [
    {
      label: "Kantor Pusat",
      isi: kontak.kantorPusat.alamat,
      icon: Building2,
      sub: "Layanan administrasi & pengaduan pusat",
    },
    {
      label: "Call Center 24 Jam",
      isi: kontak.kantorPusat.callCenter,
      icon: Phone,
      sub: "Bebas pulsa & siaga darurat nonstop",
      href: "tel:0222509030",
      cta: "Panggil Langsung",
    },
    {
      label: "WhatsApp Layanan",
      isi: kontak.kantorPusat.whatsapp,
      icon: PhoneCall,
      sub: "Kirim foto meter & bukti aduan",
      href: `https://wa.me/62${kontak.kantorPusat.whatsapp.replace(/\D/g, "").replace(/^0/, "")}`,
      cta: "Kirim Pesan",
      isExternal: true,
    },
    {
      label: "Email Resmi",
      isi: kontak.kantorPusat.email,
      icon: Mail,
      sub: "Surat dinas & korespondensi",
      href: `mailto:${kontak.kantorPusat.email}`,
      cta: "Kirim Email",
    },
    {
      label: "Jam Layanan Loket",
      isi: kontak.kantorPusat.jamLayanan,
      icon: Clock,
      sub: "Loket pembayaran kasir & customer service",
    },
  ]

  return (
    <HalamanInfo
      judul="Kontak & Kantor Layanan"
      deskripsi={`Pusat komunikasi dan jaringan kantor pelayanan cabang ${profil.nama} di seluruh wilayah Kota Bandung.`}
    >
      {/* 1. KONTEN UTAMA: KARTU KONTAK TERPADU */}
      <Bagian
        judul="Saluran Komunikasi Utama"
        subjudul="Hubungi kanal resmi kantor pusat kami untuk konsultasi, informasi rekening, dan laporan gangguan."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kartuKontakUtama.map((k, idx) => {
            const Icon = k.icon
            return (
              <div
                key={idx}
                className="motion-card-interactive gradient-card-subtle group flex flex-col justify-between rounded-xl border border-border p-5 shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground transition-transform duration-200 group-hover:scale-105 group-hover:bg-primary/10">
                      <Icon className="size-4.5 text-primary" />
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase">
                      Resmi
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {k.label}
                    </h3>
                    <p className="mt-1 text-sm sm:text-base font-semibold text-foreground leading-snug">
                      {k.isi}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {k.sub}
                    </p>
                  </div>
                </div>

                {k.href && (
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <a
                      href={k.href}
                      target={k.isExternal ? "_blank" : undefined}
                      rel={k.isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>{k.cta || "Hubungi"}</span>
                      {k.isExternal ? (
                        <ExternalLink className="size-3" />
                      ) : (
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      )}
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Bagian>

      {/* 2. JARINGAN KANTOR CABANG / PELAYANAN WILAYAH */}
      <Bagian
        judul="Jaringan Kantor Pelayanan Wilayah"
        subjudul="Kunjungi posko dan kantor cabang operasional terdekat di wilayah domisili Anda."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kontak.kantorCabang.map((c, idx) => (
            <div
              key={c.id || idx}
              className="motion-card-interactive gradient-card-subtle group flex flex-col justify-between rounded-xl border border-border p-5 shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {c.wilayah || `Wilayah ${idx + 1}`}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Kantor Cabang
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                    {c.nama}
                  </h3>
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground mt-0.5 transition-colors group-hover:text-primary" />
                    <span>{c.alamat}</span>
                  </p>
                </div>

                <div className="pt-1 text-xs font-mono text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3 text-muted-foreground" />
                    <span className="text-foreground font-semibold">{c.kontak}</span>
                  </div>
                  {c.jamLayanan && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{c.jamLayanan}</span>
                    </div>
                  )}
                </div>
              </div>

              {c.keterangan && (
                <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Cakupan:</span>{" "}
                  {c.keterangan}
                </div>
              )}
            </div>
          ))}
        </div>
      </Bagian>

      {/* 3. BANNER TANGGAP DARURAT KEBOCORAN */}
      <div className="motion-card-interactive group rounded-xl border border-amber-200/80 bg-amber-50/60 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Layanan Tanggap Darurat Pipa Bocor &amp; Aliran Mati 24 Jam
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {kontak.daruratPipa ||
                  "Temukan pipa bocor di jalan umum atau aliran air padam mendadak? Tim reaksi cepat lapangan kami siap meluncur 24 jam nonstop."}
              </p>
            </div>
          </div>

          <Link
            href={RUTE.pengaduan}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs hover:scale-102"
          >
            Sampaikan Aduan Cepat →
          </Link>
        </div>
      </div>
    </HalamanInfo>
  )
}
