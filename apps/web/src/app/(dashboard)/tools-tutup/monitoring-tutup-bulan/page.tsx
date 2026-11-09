import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Closing Periode & Tutup Bulan | Cater PDAM',
  description: 'Konsol audit 12 tahapan penutupan buku, proyeksi rekening DRD, dan eksekusi periode billing',
};

export default function TutupBulanPage() {
  return <MonitoringTutupBulan />;
}
