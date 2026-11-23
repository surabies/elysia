import type { Metadata } from "next";
import { MutasiRuteView } from "@/features/rute/components/mutasi-rute-view";

export const metadata: Metadata = { title: "Mutasi Rute Pelanggan" };

export default function Page() {
  return <MutasiRuteView />;
}
