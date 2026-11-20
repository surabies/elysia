import type { Metadata } from "next";
import { PageContainer } from "@/components/layout";
import { ImportLapDataMeterView } from "@/features/dashboard/import";

export const metadata: Metadata = {
  title: "Import LapDataMeter — Laporan Bacaan Meter PDAM",
  description: "Import CSV laporan data pembacaan meter bulanan petugas (lapdatameter) ke tabel cater_baca_meter.",
};

export default function ImportLapDataMeterPage() {
  return (
    <PageContainer>
      <ImportLapDataMeterView />
    </PageContainer>
  );
}
