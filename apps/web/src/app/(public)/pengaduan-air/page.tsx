import type { Metadata } from "next"
import { MessageSquare, Ticket } from "lucide-react"
import { auth } from "@/lib/auth/index"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PengaduanForm,
  LacakTiketForm,
  HalamanPublik,
  AsideBlok,
  KartuBerbingkai,
} from "@/features/public"
import { getPetaCakupan } from "@/server/services/geo/boundary.service"

export const metadata: Metadata = {
  title: "Pengaduan",
  description:
    "Laporkan kebocoran, air mati, atau keluhan layanan PERUMDA Tirtawening Kota Bandung",
}

export default async function PengaduanPage({
  searchParams,
}: {
  searchParams: Promise<{ nomor?: string; tab?: string }>
}) {
  const { nomor, tab } = await searchParams
  const [session, peta] = await Promise.all([auth(), getPetaCakupan()])
  const tabAwal = nomor || tab === "lacak" ? "lacak" : "lapor"

  return (
    <HalamanPublik
      eyebrow="Pengaduan & Pelacakan"
      judul="Gangguan air bukan urusan Anda sendirian."
      lede="Pipa bocor, air keruh, meter rusak, atau keluhan layanan — laporkan di sini dan pantau penanganannya lewat nomor tiket. Terbuka untuk siapa saja, tidak harus pelanggan."
      aside={
        <>
          <AsideBlok label="Tidak harus pelanggan">
            <p>
              Melihat pipa bocor di jalan? Laporkan saja — kolom nomor langganan
              boleh dikosongkan. Yang penting petugas tahu lokasinya.
            </p>
          </AsideBlok>

          <AsideBlok label="Kebocoran diprioritaskan">
            <p>
              Laporan kebocoran otomatis masuk antrean prioritas tinggi dan
              meminta titik lokasi, supaya regu lapangan langsung menuju
              sasaran.
            </p>
          </AsideBlok>

          <AsideBlok label="Ada target waktunya">
            <p>
              Setiap tiket punya target penanganan sesuai tingkat kegawatannya —
              dan target itu ikut ditampilkan di halaman pelacakan, termasuk
              saat kami melewatinya.
            </p>
          </AsideBlok>

          <AsideBlok label="Anda yang menutup tiket">
            <p>
              Petugas hanya bisa menandai laporan <em>selesai</em>. Tiket baru
              benar-benar ditutup setelah Anda mengonfirmasi — kalau masalahnya
              belum beres, buka kembali tiket yang sama.
            </p>
          </AsideBlok>

          <AsideBlok label="Simpan nomor tiket">
            <p>
              Setiap laporan mendapat nomor tiket unik — satu-satunya kunci
              memantau perkembangan penanganan. Catat atau salin begitu muncul.
            </p>
            <p className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs tracking-wider text-neutral-800">
              TW-2607-4F2A9K
            </p>
          </AsideBlok>
        </>
      }
    >
      <KartuBerbingkai
        label="Layanan · Pengaduan"
        chip="Terbuka Umum"
        className="p-0"
      >
        <Tabs defaultValue={tabAwal} className="flex w-full flex-col">
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
                <MessageSquare size={13} />
                Buat pengaduan
              </TabsTrigger>
              <TabsTrigger
                value="lacak"
                className="gap-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-black"
              >
                <Ticket size={13} />
                Lacak tiket
              </TabsTrigger>
            </TabsList>
            <div className="mt-2.5 h-px bg-neutral-200" />
          </div>

          <TabsContent value="lapor" className="px-5 pt-2 pb-5">
            <PengaduanForm sudahLogin={!!session?.user} peta={peta} />
          </TabsContent>

          <TabsContent value="lacak" className="px-5 pt-2 pb-5">
            <LacakTiketForm nomorAwal={nomor} />
          </TabsContent>
        </Tabs>
      </KartuBerbingkai>
    </HalamanPublik>
  )
}
