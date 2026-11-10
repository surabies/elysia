import type { Metadata } from 'next';
import { MonitoringProgresLapangan } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Monitoring Progres Lapangan | Cater PDAM',
  description: 'Pemantauan real-time progres pencatatan meter petugas lapangan dan DPM per rute',
};

export default function ProgresCaterPage() {
  return <MonitoringProgresLapangan />;
}
