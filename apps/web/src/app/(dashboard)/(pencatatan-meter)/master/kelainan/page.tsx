import type { Metadata } from 'next';
import { KelolaKodeKelainan } from '@/features/dashboard/master';

export const metadata: Metadata = {
  title: 'Master Kode Kelainan | PDAM Tirtawening',
  description:
    'Kamus 32 kode kelainan & kondisi catat meter, mode hitung kubikasi, alasan operasional, dan sinkronisasi aturan anomali',
};

export default function MasterKelainanPage() {
  return <KelolaKodeKelainan />;
}
