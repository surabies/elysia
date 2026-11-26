import { PindahTarifView } from "@/features/dashboard/pelanggan";

export const metadata = {
  title: "Pindah Tarif & Reklasifikasi Pelanggan",
  description: "Perubahan golongan tarif langganan dengan simulasi dampak tagihan",
};

export default function PindahTarifPage() {
  return <PindahTarifView />;
}
