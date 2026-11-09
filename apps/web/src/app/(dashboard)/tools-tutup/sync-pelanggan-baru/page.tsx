import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Sync Pelanggan Baru (Tahap 9) | Cater PDAM',
  description: 'Sinkronisasi pelanggan pendaftaran baru ke buku rute DPM periode mendatang',
};

export default function SyncPelangganBaruPage() {
  return <MonitoringTutupBulan initialTab="pipeline" highlightStage="sync-pelanggan-baru" />;
}
