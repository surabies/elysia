import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Sinkronkan Pelanggan Baru ke Rute (Langkah 5) | Cater PDAM',
  description: 'Sinkronisasi pelanggan pendaftaran baru ke buku rute DPM periode mendatang',
};

export default function SyncPelangganBaruPage() {
  return <MonitoringTutupBulan initialStep={5} highlightStage="sync-pelanggan-baru" />;
}
