import { MutasiPelangganView } from "@/features/dashboard/pelanggan";

export const metadata = {
  title: "Mutasi & Administrasi Pelanggan",
  description: "Layanan balik nama, perubahan alamat & GPS, serta status sambungan pelanggan",
};

export default function MutasiPelangganPage() {
  return <MutasiPelangganView />;
}
