import type { Metadata } from 'next';
import { PemetaanPetugasRute } from '@/features/dashboard/master';

export const metadata: Metadata = {
  title: 'Pemetaan Rute | PDAM Tirtawening',
  description: 'Pengaturan penugasan dan distribusi 126 rute pelanggan ke petugas cater',
};

export default function PemetaanPetugasPage() {
  return <PemetaanPetugasRute />;
}
