import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, ShieldCheck, HelpCircle, WalletCards } from "lucide-react"
import { CekTagihanForm, HalamanPublik, AsideBlok } from "@/features/public"

export const metadata: Metadata = {
  title: "Cek Tagihan Air",
  description:
    "Cek tagihan rekening air PERUMDA Tirtawening Kota Bandung secara online, transparan, dan terverifikasi 24 jam.",
}

const METODE_BAYAR = [
  "QRIS Dinamis",
  "Bank BJB",
  "Mandiri",
  "BCA",
  "BRI",
  "BNI",
  "Indomaret",
  "Alfamart",
  "Tokopedia",
]

export default async function CekTagihanPage({
  searchParams,
}: {
  searchParams: Promise<{ nomor?: string }>
}) {
  const { nomor } = await searchParams
  const nomorAwal = /^\d{11}$/.test(nomor ?? "") ? nomor : undefined

  return (
    <HalamanPublik
      eyebrow="Layanan Mandiri · 24 Jam"
      judul="Tagihan air Anda, transparan sampai ke rinciannya."
      lede="Masukkan 11 digit nomor langganan untuk memeriksa tagihan aktif, rincian komponen biaya air, riwayat pemakaian hingga 12 bulan terakhir, serta grafik fluktuasi konsumsi."
      aside={
        <>
          <AsideBlok label="Di mana nomor langganan saya?">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <HelpCircle className="size-4" />
              </div>
              <div className="space-y-2">
                <p>
                  Tertera di rekening atau struk pembayaran air Anda — selalu{" "}
                  <strong>11 digit angka</strong>, termasuk nol di depan.
                </p>
                <div className="rounded-lg border border-neutral-200/90 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-800">
                  <span className="text-neutral-400 select-none">Contoh: </span>
                  <span className="font-semibold text-neutral-900">00401700010</span>
                </div>
              </div>
            </div>
          </AsideBlok>

          <AsideBlok label="Kanal Pembayaran Resmi">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <WalletCards className="size-4" />
              </div>
              <div className="space-y-2.5">
                <p>
                  Setelah memeriksa tagihan, Anda dapat melunasi melalui mitra perbankan dan gerai resmi:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {METODE_BAYAR.map((m) => (
                    <span
                      key={m}
                      className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500">
                  <Link
                    href="/cara-pembayaran"
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                  >
                    Petunjuk bayar lengkap <ArrowUpRight className="size-3" />
                  </Link>
                </p>
              </div>
            </div>
          </AsideBlok>

          <AsideBlok label="Privasi & Keamanan Data">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <ShieldCheck className="size-4" />
              </div>
              <p>
                Halaman ini hanya menampilkan informasi yang diperlukan — identitas
                disamarkan secara proporsional dan setiap permintaan dibatasi kecepatannya
                (rate-limited) untuk melindungi data pelanggan.
              </p>
            </div>
          </AsideBlok>

          <AsideBlok label="Layanan Terkait">
            <ul className="space-y-2">
              {[
                { href: "/lapor-meter", label: "Lapor angka meter mandiri" },
                {
                  href: "/pengaduan-air",
                  label: "Tagihan tidak sesuai? Ajukan pengaduan",
                },
                {
                  href: "/tarif-air",
                  label: "Lihat tabel struktur tarif & golongan",
                },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600"
                  >
                    <span>{l.label}</span>
                    <ArrowUpRight className="size-3.5 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </AsideBlok>
        </>
      }
    >
      <CekTagihanForm nomorAwal={nomorAwal} />
    </HalamanPublik>
  )
}
