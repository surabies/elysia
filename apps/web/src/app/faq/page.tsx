import type { Metadata } from "next"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"

export const metadata: Metadata = { title: "Pertanyaan Umum" }

const FAQ = [
  {
    tanya: "Di mana saya menemukan nomor langganan?",
    jawab:
      "Nomor langganan 11 digit tertera pada rekening fisik air Anda atau struk pembayaran bulan sebelumnya (misalnya: 00401700010).",
  },
  {
    tanya: "Kapan batas waktu pelaporan stand meter mandiri?",
    jawab:
      "Pelaporan angka meter mandiri oleh pelanggan dibuka setiap bulan mulai tanggal 1 hingga tanggal 20. Di luar tanggal tersebut, pencatatan dilakukan langsung oleh petugas pembaca meter lapangan.",
  },
  {
    tanya: "Bagaimana cara kerja verifikasi laporan meter?",
    jawab:
      "Setelah Anda mengunggah foto meteran dan mengisi angka stand meter, staf verifikator kami akan membandingkan foto dengan angka laporan dan riwayat konsumsi sebelum disahkan ke rekening tagihan resmi.",
  },
  {
    tanya: "Berapa lama laporan gangguan air ditindaklanjuti?",
    jawab:
      "Laporan kebocoran pipa berprioritas darurat diproses dalam waktu 2 hingga 4 jam oleh Tim Reaksi Cepat. Anda dapat memantau linimasa progres penanganan secara langsung melalui menu Lacak Tiket.",
  },
  {
    tanya: "Kapan batas akhir pembayaran tagihan rekening air setiap bulannya?",
    jawab:
      "Batas akhir pembayaran rekening air adalah tanggal 20 setiap bulannya. Pembayaran melewati tanggal 20 akan dikenakan denda keterlambatan sesuai ketentuan golongan tarif pelanggan.",
  },
]

export default function PertanyaanUmumPage() {
  return (
    <HalamanInfo
      judul="Pertanyaan Umum"
      deskripsi="Jawaban untuk pertanyaan yang paling sering diajukan pelanggan seputar layanan PERUMDA Tirtawening."
    >
      <Bagian judul="Pertanyaan yang sering diajukan">
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {FAQ.map((f) => (
            <details key={f.tanya} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground outline-none focus-visible:underline">
                {f.tanya}
                <span
                  aria-hidden
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.jawab}
              </p>
            </details>
          ))}
        </div>
      </Bagian>
    </HalamanInfo>
  )
}
