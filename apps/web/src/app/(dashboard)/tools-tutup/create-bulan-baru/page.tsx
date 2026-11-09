import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Create Bulan Baru (Tahap 7) | Cater PDAM',
  description: 'Inisialisasi periode penagihan berikutnya dan penerbitan target DPM baru',
};

export default function CreateBulanBaruPage() {
  return <MonitoringTutupBulan initialTab="bulan-baru" highlightStage="create-bulan-baru" />;
}
