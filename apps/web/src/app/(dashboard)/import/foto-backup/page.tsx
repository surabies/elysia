import type { Metadata } from "next";
import { PageContainer } from "@/components/layout";
import { ImportFotoBackupView } from "@/features/dashboard/import";

export const metadata: Metadata = {
  title: "Import Foto Backup — Pemulihan Mobile HP",
  description: "Pemulihan foto stand meter, segel, dan rumah dari backup internal HP petugas.",
};

export default function ImportFotoBackupPage() {
  return (
    <PageContainer>
      <ImportFotoBackupView />
    </PageContainer>
  );
}
