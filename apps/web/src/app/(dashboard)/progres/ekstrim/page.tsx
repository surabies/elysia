import type { Metadata } from 'next';
import { MonitoringAnomaliKubikasi } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Monitoring Anomali Kubikasi | Cater PDAM',
  description: 'Deteksi dini lonjakan ekstrem, penurunan drastis, dan stand meter 0 m³',
};

export default function AnomaliKubikasiPage() {
  return <MonitoringAnomaliKubikasi />;
}
