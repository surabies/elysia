import type { Metadata } from "next"
import Link from "next/link"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"

export const metadata: Metadata = { title: "Cara Pembayaran" }

const LANGKAH = [
  {
    judul: "Cek tagihan",
    isi: "Masukkan nomor langganan 11 digit untuk melihat rincian jumlah tagihan rekening air Anda.",
  },
  {
    judul: "Pilih kanal pembayaran",
    isi: "Pilih salah satu kanal pembayaran resmi yang tersedia (ATM, Internet/Mobile Banking, Dompet Digital, Minimarket, atau Loket).",
  },
  {
    judul: "Simpan bukti bayar",
    isi: "Simpan struk atau notifikasi transaksi digital sampai status tagihan Anda berubah menjadi lunas.",
  },
]

const KANAL = [
  {
    nama: "Mobile Banking & ATM",
    deskripsi:
      "Bank Mandiri, BRI, BNI, BCA, Bank bjb melalui menu Pembayaran PAM / PDAM Kota Bandung.",
  },
  {
    nama: "Dompet Digital & E-Commerce",
    deskripsi:
      "GoPay, OVO, DANA, ShopeePay, Tokopedia, Blibli dengan memasukkan 11 digit nomor langganan.",
  },
  {
    nama: "Gerai Ritel Modern",
    deskripsi: "Indomaret, Alfamart, Alfamidi, Pos Indonesia di seluruh Indonesia.",
  },
  {
    nama: "Loket Kantor Pelayanan",
    deskripsi:
      "Kantor Pusat Jl. Badaksinga No. 10 dan kantor cabang pelayanan wilayah Bandung (Senin - Jumat 08.00 - 15.00 WIB).",
  },
]

export default function CaraPembayaranPage() {
  return (
    <HalamanInfo
      judul="Cara Pembayaran"
      deskripsi="Langkah membayar tagihan air dan kanal pembayaran resmi yang tersedia."
    >
      <Bagian judul="Langkah pembayaran">
        <ol className="flex flex-col gap-3">
          {LANGKAH.map((l, i) => (
            <li
              key={l.judul}
              className="flex gap-4 rounded-lg border border-border bg-card p-4"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-sm text-muted-foreground font-mono">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{l.judul}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l.isi}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Belum tahu jumlah tagihan?{" "}
          <Link
            href={RUTE.cekTagihan}
            className="text-foreground underline underline-offset-4"
          >
            Cek tagihan online
          </Link>
          .
        </p>
      </Bagian>

      <Bagian judul="Kanal pembayaran resmi">
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {KANAL.map((k) => (
            <li
              key={k.nama}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="font-medium text-foreground">{k.nama}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {k.deskripsi}
              </p>
            </li>
          ))}
        </ul>
      </Bagian>
    </HalamanInfo>
  )
}
