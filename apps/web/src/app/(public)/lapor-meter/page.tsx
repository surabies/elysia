import type { Metadata } from "next"
import { CalendarClock, Upload, Camera, CheckCircle2 } from "lucide-react"
import {
  LaporMeterForm,
  CekLaporanMeterForm,
  HalamanPublik,
  AsideBlok,
  LangkahList,
  PillTabs,
  PillTabsList,
  PillTabsTrigger,
  PillTabsContent,
} from "@/features/public"

export const metadata: Metadata = {
  title: "Lapor Stand Meter Mandiri",
  description:
    "Laporkan sendiri angka meter air Anda ke PERUMDA Tirtawening Kota Bandung secara akurat, transparan, dan terverifikasi.",
}

const LANGKAH = [
  {
    judul: "Input Nomor Langganan",
    detail:
      "Ketik 11 digit nomor — nama dan data sambungan pelanggan akan terverifikasi otomatis.",
  },
  {
    judul: "Foto Meter & Catat Angka",
    detail:
      "Ambil foto meteran air dengan jelas, lalu catat angka meter (hanya angka hitam).",
  },
  {
    judul: "Verifikasi Petugas Cater",
    detail:
      "Laporan dicek oleh petugas verifikasi sebagai dasar penerbitan rekening bulan berjalan.",
  },
] as const

export default async function LaporMeterPage({
  searchParams,
}: {
  searchParams: Promise<{ nomor?: string; tab?: string; nosamb?: string }>
}) {
  const { nomor: rawNomor, tab, nosamb } = await searchParams
  const raw = (rawNomor ?? nosamb ?? "").replace(/\D/g, "")
  const nomor = raw.length === 11 ? raw : (raw || undefined)
  const tabAwal = tab === "cek" ? "cek" : "lapor"

  return (
    <HalamanPublik
      eyebrow="Layanan Mandiri · 24 Jam"
      judul="Laporkan angka meter Anda — biar tagihan presisi sesuai pemakaian."
      lede="Petugas pencatat meter belum sempat mampir ke rumah bulan ini? Anda dapat mengirimkan foto dan angka stand meter mandiri. Laporan diverifikasi petugas sebelum menjadi dasar perhitungan tagihan."
      aside={
        <>
          <AsideBlok label="Panduan Membaca Angka Meter">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Pada meter air analog terdapat 2 warna penunjuk angka:
              </p>
              {/* Visual Meter Roll Demo */}
              <div className="rounded-xl border border-border bg-neutral-900 p-3 text-white shadow-inner">
                <div className="flex items-center justify-between pb-1.5 text-[10px] font-mono text-neutral-400 uppercase">
                  <span>Angka Hitam (m³)</span>
                  <span className="text-red-400">Merah (Liter)</span>
                </div>
                <div className="flex items-center justify-center gap-1 font-mono text-lg font-bold">
                  {/* Angka Hitam */}
                  <span className="flex size-7 items-center justify-center rounded bg-neutral-800 text-white shadow-xs">0</span>
                  <span className="flex size-7 items-center justify-center rounded bg-neutral-800 text-white shadow-xs">1</span>
                  <span className="flex size-7 items-center justify-center rounded bg-neutral-800 text-white shadow-xs">4</span>
                  <span className="flex size-7 items-center justify-center rounded bg-neutral-800 text-white shadow-xs">2</span>
                  <span className="text-neutral-500 font-normal">,</span>
                  {/* Angka Merah */}
                  <span className="flex size-7 items-center justify-center rounded bg-red-950 text-red-400 border border-red-800/50">8</span>
                  <span className="flex size-7 items-center justify-center rounded bg-red-950 text-red-400 border border-red-800/50">5</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Laporkan angka hitam</strong> saja (satuan meter kubik).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="size-1.5 rounded-full bg-border shrink-0 mt-1.5 ml-1" />
                  <span>Abaikan angka merah (satuan liter / desimal).</span>
                </li>
              </ul>
            </div>
          </AsideBlok>

          <AsideBlok label="Cara Kerjanya">
            <LangkahList langkah={LANGKAH} />
          </AsideBlok>

          <AsideBlok label="Standar Mutu Foto">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400">
                <Camera className="size-4" />
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• Seluruh angka pada dial meter terbaca jelas tanpa blur.</li>
                <li>• Kaca meteran bersih dari lumut, air tergenang, atau debu.</li>
                <li>• Format JPG, PNG, atau WEBP (dikompresi otomatis secara aman).</li>
              </ul>
            </div>
          </AsideBlok>
        </>
      }
    >
      <div className="rounded-3xl border border-border bg-card text-card-foreground p-4 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <PillTabs defaultValue={tabAwal} key={`${tabAwal}-${nomor ?? ""}`}>
          <PillTabsList>
            <PillTabsTrigger value="lapor">
              <Upload className="size-4 shrink-0 text-blue-600 dark:text-sky-400" />
              <span>Lapor Stand Meter</span>
            </PillTabsTrigger>
            <PillTabsTrigger value="cek">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
              <span>Cek Status Laporan</span>
            </PillTabsTrigger>
          </PillTabsList>

          <PillTabsContent value="lapor">
            <LaporMeterForm nomorAwal={nomor} />
          </PillTabsContent>

          <PillTabsContent value="cek">
            <CekLaporanMeterForm nomorAwal={nomor} />
          </PillTabsContent>
        </PillTabs>
      </div>
    </HalamanPublik>
  )
}
