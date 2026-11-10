import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth/index";
import {
  VerifikasiLapangan,
  roleVerifikasi,
} from "@/features/dashboard/verifikasi";

export const metadata: Metadata = {
  title: "Verifikasi Pembacaan Petugas",
};

export default async function VerifikasiPetugasPage() {
  const session = await auth();
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-8 text-sm text-muted-foreground">
          Memuat panel verifikasi petugas…
        </div>
      }
    >
      <VerifikasiLapangan role={roleVerifikasi(session?.user?.role)} />
    </Suspense>
  );
}
