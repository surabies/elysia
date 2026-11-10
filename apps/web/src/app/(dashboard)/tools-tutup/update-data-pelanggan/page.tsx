import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Rapikan Urutan Rute Pelanggan (Langkah 5) | Cater PDAM',
  description: 'Pembaruan massal nomor urut rute lapangan, koordinat GPS, dan atribut pelanggan',
};

export default function UpdateDataPelangganPage() {
  return <MonitoringTutupBulan initialStep={5} highlightStage="update-data-pelanggan" />;
}
