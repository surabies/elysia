import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Rapikan Urutan Rute Pelanggan (Tahap 4) | Cater PDAM',
  description: 'Pembaruan massal nomor urut rute lapangan, koordinat GPS, dan atribut pelanggan',
};

export default function UpdateDataPelangganPage() {
  return <MonitoringTutupBulan initialStep={4} highlightStage="update-data-pelanggan" />;
}
