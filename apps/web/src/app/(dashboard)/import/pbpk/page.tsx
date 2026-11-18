import type { Metadata } from "next";
import { PageContainer } from "@/components/layout";
import { ImportPbpkView } from "@/features/dashboard/import";

export const metadata: Metadata = {
  title: "Import PBPK — Pasang Baru & Pemasangan Kembali",
  description: "Import CSV Pasang Baru (PB) dan Pemasangan Kembali (PK) pelanggan ke DPM & Master.",
};

export default function ImportPbpkPage() {
  return (
    <PageContainer>
      <ImportPbpkView />
    </PageContainer>
  );
}
