import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Stand Angkat GWM (Tahap 2) | Cater PDAM',
  description: 'Penguncian stand meter lama dan stand pasang meter baru transaksi ganti water meter',
};

export default function StandAngkatPage() {
  return <MonitoringTutupBulan initialTab="stand-angkat" highlightStage="stand-angkat" />;
}
