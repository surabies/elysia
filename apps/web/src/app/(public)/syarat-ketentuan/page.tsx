import type { Metadata } from "next"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"

export const metadata: Metadata = { title: "Syarat & Ketentuan" }

export default function SyaratKetentuanPage() {
  return (
    <HalamanInfo
      judul="Syarat & Ketentuan"
      deskripsi="Ketentuan penggunaan portal pelayanan digital PERUMDA Tirtawening Kota Bandung."
    >
      <Bagian judul="Penggunaan layanan mandiri">
        <p className="text-muted-foreground leading-relaxed">
          Dengan mengakses portal ini, Anda menyatakan bahwa data dan laporan yang
          Anda sampaikan (termasuk laporan stand meter dan laporan gangguan air)
          adalah benar dan dapat dipertanggungjawabkan sesuai kondisi faktual di
          lapangan.
        </p>
      </Bagian>

      <Bagian judul="Pelaporan stand meter">
        <p className="text-muted-foreground leading-relaxed">
          Pelaporan mandiri angka stand meter hanya berlaku setiap bulan antara
          tanggal 1 sampai dengan tanggal 20. Foto meter yang diunggah wajib
          memperlihatkan angka stand meter air secara jelas dan tidak buram.
          Laporan yang dimanipulasi atau tidak sesuai hasil verifikasi petugas dapat
          dibatalkan demi akurasi rekening air.
        </p>
      </Bagian>

      <Bagian judul="Kerahasiaan akun">
        <p className="text-muted-foreground leading-relaxed">
          Pengguna bertanggung jawab penuh atas keamanan kata sandi akun masing-masing.
          Segera hubungi tim administrator atau gunakan fitur Lupa Password apabila
          Anda menduga adanya akses tanpa izin terhadap akun Anda.
        </p>
      </Bagian>
    </HalamanInfo>
  )
}
