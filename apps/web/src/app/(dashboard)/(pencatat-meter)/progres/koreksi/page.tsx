import type { Metadata } from 'next';
import { MonitoringKoreksiStand } from '@/features/dashboard/progres';

export const metadata: Metadata = {
  title: 'Monitoring Koreksi Stand & Audit Trail | Cater PDAM',
  description: 'Riwayat resmi penyesuaian angka meter, perbaikan salah baca, dan perubahan kubikasi dengan audit log',
};

export default function KoreksiStandPage() {
  return <MonitoringKoreksiStand />;
}
