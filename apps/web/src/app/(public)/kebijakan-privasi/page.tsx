import type { Metadata } from "next"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"

export const metadata: Metadata = { title: "Kebijakan Privasi" }

export default function KebijakanPrivasiPage() {
  return (
    <HalamanInfo
      judul="Kebijakan Privasi"
      deskripsi="Komitmen PERUMDA Tirtawening Kota Bandung dalam melindungi data pribadi dan privasi pelanggan."
    >
      <Bagian judul="Pengumpulan data">
        <p className="text-muted-foreground leading-relaxed">
          Kami mengumpulkan informasi yang Anda berikan secara sukarela saat
          menggunakan portal ini, termasuk nama lengkap, nomor langganan, nomor
          telepon/WhatsApp, alamat email, alamat lokasi kejadian gangguan, koordinat
          spasial, serta foto angka meter mandiri.
        </p>
      </Bagian>

      <Bagian judul="Penggunaan informasi">
        <p className="text-muted-foreground leading-relaxed">
          Informasi yang dikumpulkan hanya digunakan untuk verifikasi pencatatan
          meter, perhitungan tagihan air bulanan, tindak lanjut pengaduan teknis
          oleh petugas reaksi cepat, serta pengiriman notifikasi status pelayanan.
          Data Anda tidak akan diperjualbelikan atau dibagikan kepada pihak ketiga di
          luar kepentingan operasional resmi.
        </p>
      </Bagian>

      <Bagian judul="Keamanan data">
        <p className="text-muted-foreground leading-relaxed">
          Seluruh transmisi data dienkripsi menggunakan protokol HTTPS/TLS modern.
          Akses terhadap data pelanggan dibatasi secara ketat berdasarkan peran
          kepegawaian resmi (Role-Based Access Control) dan diaudit secara berkala.
        </p>
      </Bagian>
    </HalamanInfo>
  )
}
