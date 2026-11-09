import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Update Zonasi & Rute (Tahap 3) | Cater PDAM',
  description: 'Pembaruan struktur zonasi wilayah, kelurahan, dan rute pembacaan meter',
};

export default function UpdateZonasiPage() {
  return <MonitoringTutupBulan initialTab="pipeline" highlightStage="update-zonasi" />;
}
