import type { Metadata } from 'next';
import { PerbandinganTagihanView } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Perbandingan Tagihan Antar Periode | Cater PDAM',
  description:
    'Halaman komparasi jumlah pelanggan, kubikasi air (m3), dan omzet tagihan antar periode per golongan tarif',
};

export default function CreatePerbandinganPage() {
  return <PerbandinganTagihanView />;
}
