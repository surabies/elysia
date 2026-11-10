import type { Metadata } from "next"
import Link from "next/link"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"

export const metadata: Metadata = { title: "Kontak & Kantor Layanan" }

const KONTAK = [
  {
    label: "Kantor Pusat",
    isi: "Jl. Badaksinga No. 10, Kel. Lebak Siliwangi, Kec. Coblong, Kota Bandung 40132",
  },
  { label: "Call Center / Pengaduan", isi: "(022) 2509030 / (022) 2509032" },
  { label: "WhatsApp Layanan", isi: "0811-200-0020" },
  { label: "Email Resmi", isi: "sekretariat@tirtawening.co.id" },
  { label: "Jam Layanan Loket", isi: "Senin – Jumat: 08.00 – 15.00 WIB" },
]

const CABANG = [
  {
    nama: "Kantor Pelayanan Wilayah Utara",
    alamat: "Jl. Siliwangi No. 12, Bandung",
    kontak: "(022) 2500001",
  },
  {
    nama: "Kantor Pelayanan Wilayah Timur",
    alamat: "Jl. Soekarno Hatta No. 450, Bandung",
    kontak: "(022) 7500002",
  },
  {
    nama: "Kantor Pelayanan Wilayah Barat",
    alamat: "Jl. Pajajaran No. 80, Bandung",
    kontak: "(022) 6000003",
  },
  {
    nama: "Kantor Pelayanan Wilayah Selatan",
    alamat: "Jl. Moh. Toha No. 180, Bandung",
    kontak: "(022) 5200004",
  },
]

export default function KontakPage() {
  return (
    <HalamanInfo
      judul="Kontak & Kantor Layanan"
      deskripsi="Hubungi layanan pelanggan PERUMDA Tirtawening atau kunjungi kantor pelayanan terdekat."
    >
      <Bagian judul="Informasi kontak utama">
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {KONTAK.map((k) => (
            <div
              key={k.label}
              className="rounded-lg border border-border bg-card p-4"
            >
              <dt className="text-sm text-muted-foreground">{k.label}</dt>
              <dd className="mt-1 font-medium text-foreground">{k.isi}</dd>
            </div>
          ))}
        </dl>
      </Bagian>

      <Bagian judul="Kantor pelayanan wilayah">
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {CABANG.map((c) => (
            <li
              key={c.nama}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="font-medium text-foreground">{c.nama}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.alamat}</p>
              <p className="mt-1 text-xs text-muted-foreground font-mono">
                Telp: {c.kontak}
              </p>
            </li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Ada kebocoran pipa darurat?">
        <p className="text-muted-foreground">
          Untuk kebocoran pipa atau gangguan air darurat, gunakan layanan
          pengaduan 24 jam agar laporan Anda segera diverifikasi oleh tim reaksi cepat.{" "}
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
