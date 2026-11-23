import type { Metadata } from 'next';
import { PenggabunganRuteView } from '@/features/rute';

export const metadata: Metadata = {
  title: 'Kelola Rute Pencatatan Petugas | PDAM Tirtawening',
  description: 'Gabungkan atau pindahkan pelanggan dari satu rute baca ke rute petugas lain.',
};

export default function PenggabunganRutePage() {
  return <PenggabunganRuteView />;
}
