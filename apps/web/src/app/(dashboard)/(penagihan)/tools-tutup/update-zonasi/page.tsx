import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Pemetaan Zonasi & Rute (Langkah 1) | Cater PDAM',
  description: 'Pembaruan struktur zonasi wilayah, kelurahan, dan rute pembacaan meter',
};

export default function UpdateZonasiPage() {
  return <MonitoringTutupBulan initialStep={1} highlightStage="update-zonasi" />;
}
