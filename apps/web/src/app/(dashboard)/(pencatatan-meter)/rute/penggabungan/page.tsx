import type { Metadata } from 'next';
import { PenggabunganRuteView } from '@/features/dashboard/rute';

export const metadata: Metadata = {
  title: 'Penggabungan Rute | PDAM Tirtawening',
  description: 'Gabungkan atau pindahkan pelanggan dari satu rute baca ke rute petugas lain.',
};

export default function PenggabunganRutePage() {
  return <PenggabunganRuteView />;
}
