import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Konsol Tutup Bulan | Cater PDAM',
  description:
    'Alur terpandu 4 tahap untuk pemeriksaan kesiapan data, pengesahan bacaan meter, penguncian tagihan DRD, dan pembukaan jadwal bulan baru',
};

export default function TutupBulanPage() {
  return <MonitoringTutupBulan />;
}
