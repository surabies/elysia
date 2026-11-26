import type { Metadata } from 'next';
import { GantiMeterPage } from "@/features/dashboard/gwm";

export const metadata: Metadata = {
  title: "Ganti Water Meter | PDAM Tirtawening",
  description: "Pencatatan penggantian water meter fisik dan stand angkat",
};

export default function Page() {
  return <GantiMeterPage />;
}
