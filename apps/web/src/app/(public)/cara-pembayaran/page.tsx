import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  QrCode,
  Receipt,
  Search,
  Smartphone,
  Store,
} from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"
import {
  pengaturanService,
  DEFAULT_CARA_PEMBAYARAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Cara Pembayaran Tagihan Rekening Air" }
export const dynamic = "force-dynamic"

export default async function CaraPembayaranPage() {
  const data = await pengaturanService.getPengaturan(
    "cara_pembayaran",
    DEFAULT_CARA_PEMBAYARAN
  )

  const ikonKanal = [
    Smartphone,
    QrCode,
    Store,
    Building2,
  ]

  return (
    <HalamanInfo
      judul={data.judul || "Cara Pembayaran Tagihan Rekening Air"}
      deskripsi={
        data.deskripsi ||
        "Panduan langkah pembayaran tagihan air minum dan daftar mitra perbankan serta saluran digital resmi yang terverifikasi."
      }
      actions={
        <Link
          href={RUTE.cekTagihan}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-all shadow-xs hover:scale-102"
        >
          <Search className="size-3.5" />
          <span>Cek Tagihan Saya</span>
        </Link>
      }
    >
      {/* 1. LANGKAH PEMBAYARAN: STEPPER CARDS */}
      <Bagian
        judul="Tahapan Pembayaran Mudah"
        subjudul="Tiga langkah sederhana melunasi rekening pemakaian air minum bulanan Anda."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.langkah.map((l, i) => (
            <div
              key={i}
              className="motion-card-interactive gradient-card-subtle group relative flex flex-col justify-between rounded-xl border border-border p-5 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground transition-transform duration-200 group-hover:scale-110">
                    0{i + 1}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    Tahap {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                    {l.judul}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {l.isi}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Bagian>

      {/* 2. KANAL PEMBAYARAN RESMI */}
      <Bagian
        judul="Kanal &amp; Mitra Pembayaran Terverifikasi"
        subjudul="Pilih saluran perbankan, dompet digital, atau gerai ritel terdekat yang paling nyaman bagi Anda."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.kanal.map((k, i) => {
            const Icon = ikonKanal[i % ikonKanal.length]
            return (
              <div
                key={i}
                className="motion-card-interactive gradient-card-subtle group flex flex-col justify-between rounded-xl border border-border p-5 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/10">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      {k.nama}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {k.deskripsi}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
                  Format: 11 Digit Nomor Langganan
                </div>
              </div>
            )
          })}
        </div>
      </Bagian>

      {/* 3. ATURAN JATUH TEMPO & DENDA */}
      {data.catatanDenda && (
        <div className="motion-card-interactive group rounded-xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <Calendar className="size-5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5 transition-transform duration-200 group-hover:scale-110" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Ketentuan Batas Pembayaran Rekening
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {data.catatanDenda}
              </p>
            </div>
          </div>
        </div>
      )}
    </HalamanInfo>
  )
}
