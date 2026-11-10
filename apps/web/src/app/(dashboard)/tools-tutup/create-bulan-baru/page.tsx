import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Buka Jadwal Bulan Baru (Langkah 5) | Cater PDAM',
  description: 'Inisialisasi periode penagihan berikutnya dan penerbitan target DPM baru',
};

export default function CreateBulanBaruPage() {
  return <MonitoringTutupBulan initialStep={5} initialTab="bulan-baru" highlightStage="create-bulan-baru" />;
}
