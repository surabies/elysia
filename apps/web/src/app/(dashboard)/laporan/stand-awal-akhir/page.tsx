import type { Metadata } from 'next';
import { LaporanStandAwalAkhir } from '@/features/dashboard/laporan';

export const metadata: Metadata = {
  title: 'Laporan Stand Awal & Akhir Meter | PDAM Tirtawening',
  description: 'Komparasi angka stand meter lalu (STML) terhadap stand meter angkat (STMA) dan kubikasi',
};

export default function StandAwalAkhirPage() {
  return <LaporanStandAwalAkhir />;
}
