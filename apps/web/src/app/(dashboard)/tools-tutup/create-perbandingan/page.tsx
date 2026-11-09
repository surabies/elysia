import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Create Perbandingan (Tahap 6) | Cater PDAM',
  description: 'Komparasi konsumsi kubikasi dan omzet tagihan air antar periode penagihan',
};

export default function CreatePerbandinganPage() {
  return <MonitoringTutupBulan initialTab="perbandingan" highlightStage="create-perbandingan" />;
}
