import type { Metadata } from "next";
import { auth } from "@/lib/auth/index";
import { VerifikasiLapangan } from "@/features/dashboard/verifikasi/components/VerifikasiLapangan";
import { roleVerifikasi } from "@/features/dashboard/verifikasi/lib/RoleVerifikasi";

export const metadata: Metadata = {
  title: "Verifikasi Pembacaan Petugas",
};

export default async function VerifikasiPetugasPage() {
  const session = await auth();
  return <VerifikasiLapangan role={roleVerifikasi(session?.user?.role)} />;
}
