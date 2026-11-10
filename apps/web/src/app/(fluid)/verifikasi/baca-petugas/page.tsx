import type { Metadata } from "next";
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
  return <VerifikasiLapangan role={roleVerifikasi(session?.user?.role)} />;
}
