import type { Metadata } from 'next';
import { StandAngkatView } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Data Pergantian Meter (Stand Angkat) | Cater PDAM',
  description:
    'Halaman persetujuan stand meter lama dan stand pasang meter baru untuk transaksi ganti water meter',
};

export default function StandAngkatPage() {
  return <StandAngkatView />;
}
