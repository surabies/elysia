import type { Metadata } from 'next';
import { MutasiRuteView } from '@/features/dashboard/rute';

export const metadata: Metadata = {
  title: 'Mutasi Rute | PDAM Tirtawening',
  description: 'Pindahkan satu pelanggan ke rute baca dan nomor urut baru.',
};

export default function MutasiRutePage() {
  return <MutasiRuteView />;
}
