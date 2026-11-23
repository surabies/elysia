import type { Metadata } from "next";
import { PenggabunganRuteView } from "@/features/rute/components/penggabungan-rute-view";

export const metadata: Metadata = { title: "Kelola Rute Pencatatan Petugas" };

export default function Page() {
  return <PenggabunganRuteView />;
}
