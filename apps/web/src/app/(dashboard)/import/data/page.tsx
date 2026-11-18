import type { Metadata } from "next";
import { PageContainer } from "@/components/layout";
import { ImportDataPencatatanView } from "@/features/dashboard/import";

export const metadata: Metadata = {
  title: "Import Data Pencatatan — Stand Meter Recovery",
  description: "Import file data pencatatan stand meter pemulihan kendala jaringan.",
};

export default function ImportDataPage() {
  return (
    <PageContainer>
      <ImportDataPencatatanView />
    </PageContainer>
  );
}
