import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoPelangganView } from "@/features/dashboard/info-pelanggan";

export const metadata: Metadata = { title: "Info Pelanggan" };

// Halaman layar penuh tanpa navbar/sidebar bawaan. Judul dan pencarian ada di dalam view.
export default function InfoPelangganPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <Suspense fallback={null}>
        <InfoPelangganView />
      </Suspense>
    </div>
  );
}
