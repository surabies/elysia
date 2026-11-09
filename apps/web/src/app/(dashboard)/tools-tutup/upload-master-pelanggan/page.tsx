import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Upload Master Pelanggan (Tahap 8) | Cater PDAM',
  description: 'Sinkronisasi database induk master pelanggan dan validasi status sambungan',
};

export default function UploadMasterPelangganPage() {
  return <MonitoringTutupBulan initialTab="pipeline" highlightStage="upload-master-pelanggan" />;
}
