import type { Metadata } from 'next';
import { KelolaKodeKelainan } from '@/features/dashboard/master';

export const metadata: Metadata = {
  title: 'Kode Kelainan | PDAM Tirtawening',
  description: 'Master 17 kode jenis kelainan fisik water meter dan tindakan operasional',
};

export default function MasterKelainanPage() {
  return <KelolaKodeKelainan />;
}
