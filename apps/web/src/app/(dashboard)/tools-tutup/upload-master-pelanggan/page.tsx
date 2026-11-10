import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Validasi Master Pelanggan (Langkah 1) | Cater PDAM',
  description: 'Sinkronisasi database induk master pelanggan dan validasi status sambungan',
};

export default function UploadMasterPelangganPage() {
  return <MonitoringTutupBulan initialStep={1} highlightStage="upload-master-pelanggan" />;
}
