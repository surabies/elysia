import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/index";
import {
  VerifikasiLapangan,
  roleVerifikasi,
} from "@/components/tanstacktable";

export const metadata: Metadata = {
  title: "Verifikasi Pembacaan Petugas",
};

export default async function VerifikasiPetugasPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const rawWidth = cookieStore.get("verif_panel_width")?.value;
  const parsedWidth = rawWidth ? parseInt(rawWidth, 10) : 340;
  const defaultWidth =
    !isNaN(parsedWidth) && parsedWidth >= 280 && parsedWidth <= 600
      ? parsedWidth
      : 340;

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-8 text-sm text-muted-foreground">
          Memuat panel verifikasi petugas…
        </div>
      }
    >
      <VerifikasiLapangan
        role={roleVerifikasi(session?.user?.role)}
        defaultWidth={defaultWidth}
      />
    </Suspense>
  );
}
