import type { Metadata } from "next"
import Link from "next/link"
import { MessageSquare, Ticket, AlertTriangle, ShieldCheck, MapPin, ArrowUpRight, Clock } from "lucide-react"
import { auth } from "@/lib/auth/index"
import {
  PengaduanForm,
  LacakTiketForm,
  HalamanPublik,
  AsideBlok,
  PillTabs,
  PillTabsList,
  PillTabsTrigger,
  PillTabsContent,
} from "@/features/public"
import { getPetaCakupan } from "@/server/services/geo/boundary.service"

export const metadata: Metadata = {
  title: "Pengaduan Gangguan Air & Lacak Tiket",
  description:
    "Sampaikan laporan kebocoran pipa, air keruh, atau gangguan meteran air PERUMDA Tirtawening Kota Bandung secara cepat dan pantau progres penanganan secara transparan.",
}

const SLA_LIST = [
  { tipe: "Pipa Distribusi Bocor (TRC)", target: "< 6 Jam", badge: "Prioritas 1" },
  { tipe: "Air Keruh / Aliran Terhenti", target: "< 12 Jam", badge: "Prioritas 2" },
  { tipe: "Meter Rusak / Akurasi", target: "1 - 2 Hari", badge: "Jadwal" },
]

export default async function PengaduanPage({
  searchParams,
}: {
  searchParams: Promise<{ nomor?: string; tab?: string; tiket?: string; nosamb?: string }>
}) {
  const { nomor, tab, tiket, nosamb } = await searchParams
  const [session, peta] = await Promise.all([auth(), getPetaCakupan()])
  const rawNomor = (nomor ?? tiket ?? nosamb ?? "").trim()
  const nomorAwal = rawNomor || undefined
  const tabAwal = nomorAwal || tab === "lacak" ? "lacak" : "lapor"

  return (
    <HalamanPublik
      eyebrow="Pengaduan & Pelacakan GIS"
      judul="Gangguan air bukan urusan Anda sendirian."
      lede="Pipa bocor di jalan, air keruh, aliran terhenti, atau meter rusak — laporkan di sini dan pantau penanganannya lewat nomor tiket. Terbuka untuk seluruh warga Bandung, tidak wajib memiliki nomor langganan."
      aside={
        <>
          <AsideBlok label="Prioritas Reaksi Cepat (TRC)">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="size-4" />
              </div>
              <div className="space-y-1.5 text-xs text-neutral-600">
                <p>
                  Melihat kebocoran pipa air di jalan raya atau pemukiman?
                </p>
                <p>
                  <strong>Kolom nomor langganan boleh dikosongkan.</strong> Cukup
                  tandai titik lokasi peta dan unggah foto agar regu lapangan dapat
                  langsung menuju sasaran.
                </p>
              </div>
            </div>
          </AsideBlok>

          <AsideBlok label="Target Kecepatan Respons (SLA)">
            <div className="space-y-2">
              {SLA_LIST.map((item) => (
                <div
                  key={item.tipe}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-neutral-400" />
                    <span className="font-medium text-neutral-800">{item.tipe}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-blue-700">
                    {item.target}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-neutral-500">
                Target waktu penanganan ditampilkan di pelacakan tiket secara transparan.
              </p>
            </div>
          </AsideBlok>

          <AsideBlok label="Peta Kendali Spasial">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <MapPin className="size-4" />
              </div>
              <div className="space-y-2 text-xs text-neutral-600">
                <p>
                  Ingin memantau persebaran titik perbaikan pipa dan info gangguan di seluruh Kota Bandung?
                </p>
                <Link
                  href="/peta-pengaduan"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                >
                  Buka Peta Pengaduan GIS <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>
          </AsideBlok>

          <AsideBlok label="Hak Konfirmasi Pelapor">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-4" />
              </div>
              <p className="text-xs text-neutral-600">
                Petugas hanya bisa menandai status <em>Perbaikan Selesai</em>. Tiket baru
                benar-benar ditutup setelah Anda mengonfirmasi bahwa air sudah mengalir
                normal kembali.
              </p>
            </div>
          </AsideBlok>
        </>
      }
    >
      <div className="rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <PillTabs defaultValue={tabAwal} key={`${tabAwal}-${nomorAwal ?? ""}`}>
          <PillTabsList>
            <PillTabsTrigger value="lapor">
              <MessageSquare className="size-4 shrink-0 text-blue-600" />
              <span>Buat Pengaduan Baru</span>
            </PillTabsTrigger>
            <PillTabsTrigger value="lacak">
              <Ticket className="size-4 shrink-0 text-neutral-500" />
              <span>Lacak Tiket Aduan</span>
            </PillTabsTrigger>
          </PillTabsList>

          <PillTabsContent value="lapor">
            <PengaduanForm sudahLogin={!!session?.user} peta={peta} />
          </PillTabsContent>

          <PillTabsContent value="lacak">
            <LacakTiketForm nomorAwal={nomorAwal} />
          </PillTabsContent>
        </PillTabs>
      </div>
    </HalamanPublik>
  )
}
