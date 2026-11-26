import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/index";
import {
  VerifikasiMandiri,
  roleVerifikasi,
} from "@/components/tanstacktable";

export const metadata: Metadata = {
  title: "Lapor Mandiri (Baca Pelanggan) | PDAM Tirtawening",
  description: "Validasi foto dan stand pembacaan mandiri warga",
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
  const cookieStore = await cookies();
  const rawWidth = cookieStore.get("verif_panel_width")?.value;
  const parsedWidth = rawWidth ? parseInt(rawWidth, 10) : 340;
  const defaultWidth =
    !isNaN(parsedWidth) && parsedWidth >= 280 && parsedWidth <= 600
      ? parsedWidth
      : 340;

  return (
    <VerifikasiMandiri
      bisaAksi={STAFF_UP.has(role)}
      role={role}
      defaultWidth={defaultWidth}
    />
  );
}
