import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Update Data Pelanggan (Tahap 10) | Cater PDAM',
  description: 'Pembaruan massal nomor urut rute lapangan, koordinat GPS, dan atribut pelanggan',
};

export default function UpdateDataPelangganPage() {
  return <MonitoringTutupBulan initialTab="pipeline" highlightStage="update-data-pelanggan" />;
}
