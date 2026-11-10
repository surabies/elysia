import type { Metadata } from "next"
import { CalendarClock, Upload } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LaporMeterForm,
  CekLaporanMeterForm,
  HalamanPublik,
  AsideBlok,
  LangkahList,
  KartuBerbingkai,
} from "@/features/public"

export const metadata: Metadata = {
  title: "Lapor meter mandiri",
  description:
    "Laporkan sendiri angka meter air Anda ke PERUMDA Tirtawening Kota Bandung",
}

const LANGKAH = [
  {
    judul: "Cari nomor langganan Anda",
    detail:
      "Ketik 11 digit nomor — identitas sambungan muncul otomatis untuk dicocokkan.",
  },
  {
    judul: "Foto meter & isi angkanya",
    detail:
      "Potret angka hitam pada meter air sebagai bukti, lalu tulis angkanya.",
  },
  {
    judul: "Petugas memverifikasi",
    detail:
      "Laporan berstatus menunggu sampai foto dicek petugas — baru menjadi dasar tagihan.",
  },
] as const

export default async function LaporMeterPage({
  searchParams,
}: {
  searchParams: Promise<{ nomor?: string; tab?: string }>
}) {
  const { nomor, tab } = await searchParams
  const tabAwal = nomor || tab === "cek" ? "cek" : "lapor"

  return (
    <HalamanPublik
      eyebrow="Layanan Mandiri · 24 Jam"
      judul="Laporkan angka meter Anda — biar tagihan sesuai pemakaian."
      lede="Petugas tidak sempat mampir bulan ini? Kirim sendiri angka meter beserta foto bukti. Satu laporan per bulan, diverifikasi petugas sebelum dipakai menghitung tagihan."
      aside={
        <>
          <AsideBlok label="Cara kerjanya">
            <LangkahList langkah={LANGKAH} />
          </AsideBlok>

          <AsideBlok label="Syarat foto">
            <ul className="list-inside space-y-1.5">
              <li>Angka pada meter terbaca jelas, tidak buram.</li>
              <li>
                Format JPG, PNG, atau WEBP — foto besar dikecilkan otomatis.
              </li>
              <li>Abaikan angka merah; yang dilaporkan angka hitam.</li>
            </ul>
          </AsideBlok>
        </>
      }
    >
      <KartuBerbingkai
        label="Formulir · Lapor Meter"
        chip="1 Laporan / Bulan"
        className="p-0"
      >
        <Tabs
          key={`${tabAwal}-${nomor ?? ""}`}
          defaultValue={tabAwal}
          className="flex w-full flex-col"
        >
          <div className="px-5 pt-4 pb-2.5">
            <TabsList
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
              }}
              className="h-9 border border-neutral-200 bg-neutral-100 text-neutral-700"
            >
              <TabsTrigger
                value="lapor"
                className="gap-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-black"
              >
                <Upload size={13} />
                Lapor meter
              </TabsTrigger>
              <TabsTrigger
                value="cek"
                className="gap-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-black"
              >
                <CalendarClock size={13} />
                Cek laporan
              </TabsTrigger>
            </TabsList>
            <div className="mt-2.5 h-px bg-neutral-200" />
          </div>

          <TabsContent value="lapor" className="px-5 pt-2 pb-5">
            <LaporMeterForm />
          </TabsContent>

          <TabsContent value="cek" className="px-5 pt-2 pb-5">
            <CekLaporanMeterForm nomorAwal={nomor} />
          </TabsContent>
        </Tabs>
      </KartuBerbingkai>
    </HalamanPublik>
  )
}
