import type { Metadata } from "next"
import Link from "next/link"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"

export const metadata: Metadata = { title: "Info Gangguan Air" }

type Gangguan = {
  id: string
  wilayah: string
  penyebab: string
  status: "Sedang ditangani" | "Selesai"
  perkiraan: string
}

const DAFTAR_GANGGUAN: Gangguan[] = [
  {
    id: "g-01",
    wilayah: "Kecamatan Sumur Bandung (Braga, Merdeka, Babakan Ciamis)",
    penyebab: "Perbaikan pipa distribusi utama diameter 300mm",
    status: "Sedang ditangani",
    perkiraan: "Hari ini pukul 17.00 WIB",
  },
  {
    id: "g-02",
    wilayah: "Kecamatan Coblong (Dago Bawah, Lebak Siliwangi)",
    penyebab: "Pemeliharaan berkala pompa transmisi IPA Badaksinga",
    status: "Selesai",
    perkiraan: "Normal bertahap",
  },
]

export default function InfoGangguanPage() {
  return (
    <HalamanInfo
      judul="Info Gangguan Air"
      deskripsi="Wilayah terdampak dan perkiraan waktu pemulihan gangguan air perpipaan di Kota Bandung."
    >
      <Bagian judul="Jadwal & status penanganan terkini">
        <ul className="flex flex-col gap-3">
          {DAFTAR_GANGGUAN.map((g) => (
            <li
              key={g.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{g.wilayah}</p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    g.status === "Selesai"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                  }`}
                >
                  {g.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {g.penyebab}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Perkiraan pemulihan: {g.perkiraan}
              </p>
            </li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Wilayah Anda belum tercantum?">
        <p className="text-muted-foreground">
          Sampaikan gangguan air di tempat Anda agar segera diverifikasi oleh
          petugas reaksi cepat.{" "}
          <Link
            href={RUTE.pengaduan}
            className="text-foreground underline underline-offset-4 font-medium"
          >
            Laporkan gangguan air
          </Link>
          .
        </p>
      </Bagian>
    </HalamanInfo>
  )
}
