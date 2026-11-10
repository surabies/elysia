import type { Metadata } from "next";
import { auth } from "@/lib/auth/index";
import {
  VerifikasiMandiri,
  roleVerifikasi,
} from "@/features/dashboard/verifikasi";

export const metadata: Metadata = {
  title: "Verifikasi Pembacaan Pelanggan",
};

const STAFF_UP = new Set([
  "SUPER_ADMIN",
  "DIREKSI",
  "SENIOR_MANAGER",
  "MANAGER",
  "SUPERVISOR",
  "STAFF",
]);

export default async function VerifikasiPelangganPage() {
  const session = await auth();
  const role = roleVerifikasi(session?.user?.role);
  return <VerifikasiMandiri bisaAksi={STAFF_UP.has(role)} role={role} />;
}
