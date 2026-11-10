import type { Metadata } from "next"
import Link from "next/link"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"

export const metadata: Metadata = { title: "Pasang Baru" }

const SYARAT = [
  "Fotokopi KTP / identitas diri pemohon yang masih berlaku",
  "Fotokopi bukti kepemilikan bangunan (Sertifikat Tanah / AJB / IMB / PBB terakhir)",
  "Surat kuasa bermaterai apabila pemohon bukan pemilik sah bangunan",
  "Denah lokasi atau titik koordinat bangunan yang akan dipasangi sambungan",
  "Mengisi formulir Surat Permohonan Langganan (SPL) air minum",
]

const ALUR = [
  {
    judul: "1. Pengajuan Permohonan",
    isi: "Datangi loket kantor pelayanan wilayah terdekat atau hubungi petugas layanan untuk mengisi formulir pendaftaran.",
  },
  {
    judul: "2. Survei Teknis & Gambar Rencana",
    isi: "Petugas teknis melakukan survei ke lokasi guna memeriksa jaringan pipa distribusi terdekat dan menyusun rencana anggaran biaya (RAB).",
  },
  {
    judul: "3. Pembayaran Biaya Sambungan",
    isi: "Pemohon melakukan pembayaran biaya pasang baru resmi sesuai rincian RAB di loket atau kanal perbankan mitra.",
  },
  {
    judul: "4. Pemasangan & Kalibrasi Meter",
    isi: "Teknisi memasang pipa dinas, kran meter, dan water meter air tersegel, disusul penerbitan 11 digit Nomor Langganan resmi.",
  },
]

export default function PasangBaruPage() {
  return (
    <HalamanInfo
      judul="Pasang Baru"
      deskripsi="Syarat dan alur pengajuan sambungan air minum perpipaan baru PERUMDA Tirtawening Kota Bandung."
    >
      <Bagian judul="Persyaratan dokumen">
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-muted-foreground">
          {SYARAT.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Alur tahapan pemasangan">
        <ol className="flex flex-col gap-3">
          {ALUR.map((a) => (
            <li
              key={a.judul}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="font-medium text-foreground">{a.judul}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.isi}</p>
            </li>
          ))}
        </ol>
      </Bagian>

      <Bagian judul="Butuh konsultasi lebih lanjut?">
        <p className="text-muted-foreground">
          Lihat alamat kantor pelayanan wilayah terdekat di halaman{" "}
          <Link
            href={RUTE.kontak}
            className="text-foreground underline underline-offset-4 font-medium"
          >
            Kontak &amp; Kantor Layanan
          </Link>
          .
        </p>
      </Bagian>
    </HalamanInfo>
  )
}
