import type { Metadata } from "next"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { BRAND } from "@/config/site"

export const metadata: Metadata = { title: "Profil Perusahaan" }

const MISI = [
  "Memberikan pelayanan air minum yang memenuhi standar kualitas kesehatan, kontinuitas aliran, dan kecukupan kuantitas.",
  "Meningkatkan cakupan layanan perpipaan secara merata bagi seluruh masyarakat Kota Bandung.",
  "Menerapkan tata kelola perusahaan yang baik (Good Corporate Governance) berbasis teknologi digital terintegrasi.",
  "Mendukung pelestarian sumber daya air baku dan lingkungan hidup berkelanjutan.",
]

export default function ProfilPerusahaanPage() {
  return (
    <HalamanInfo
      judul="Profil Perusahaan"
      deskripsi={`Mengenal ${BRAND.nama}, Badan Usaha Milik Daerah pengelola air minum perpipaan ${BRAND.wilayah}.`}
    >
      <Bagian judul="Tentang kami">
        <p className="text-muted-foreground leading-relaxed">
          PERUSAHAAN UMUM DAERAH TIRTAWENING KOTA BANDUNG adalah Badan Usaha Milik
          Daerah (BUMD) yang bertugas menyelenggarakan kemanfaatan umum di bidang
          penyediaan air minum dan pengelolaan air limbah bagi masyarakat Kota
          Bandung secara profesional, mandiri, dan berkeadilan sosial.
        </p>
      </Bagian>

      <Bagian judul="Visi">
        <p className="font-medium text-foreground text-lg">
          &ldquo;Menjadi Perusahaan Air Minum yang Maju, Mandiri, dan Terpercaya
          dengan Pelayanan Prima bagi Warga Kota Bandung.&rdquo;
        </p>
      </Bagian>

      <Bagian judul="Misi">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {MISI.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Sejarah singkat">
        <p className="text-muted-foreground leading-relaxed">
          Bermula dari <em>Stadswaterwerk Bandoeng</em> yang didirikan pada masa
          pemerintahan Hindia Belanda tahun 1916, institusi ini bertransformasi
          menjadi Perusahaan Daerah Air Minum (PDAM) Kota Bandung pada tahun 1974,
          dan kini ditetapkan sebagai PERUMDA Tirtawening Kota Bandung berdasarkan
          Peraturan Daerah Kota Bandung.
        </p>
      </Bagian>
    </HalamanInfo>
  )
}
