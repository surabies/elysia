import type { Metadata } from 'next';
import { MonitoringProgresWilayah } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Monitoring Progres Wilayah | Cater PDAM',
  description: 'Persentase capaian pembacaan meter air per kelurahan dan zona distribusi',
};

export default function ProgresWilayahPage() {
  return <MonitoringProgresWilayah />;
}
