import type { Metadata } from "next";
import { PageContainer } from "@/components/layout";
import { ImportRNomorView } from "@/features/dashboard/import";

export const metadata: Metadata = {
  title: "Import R Nomor — Pemutusan Pelanggan",
  description: "Input dan pembaruan data rekening pemutusan pelanggan (R Nomor).",
};

export default function ImportRNomorPage() {
  return (
    <PageContainer>
      <ImportRNomorView />
    </PageContainer>
  );
}
