import type { Metadata } from 'next';
import { KelolaPetugas } from '@/features/dashboard/master';

export const metadata: Metadata = {
  title: 'Master Petugas Cater | PDAM Tirtawening',
  description: 'Manajemen master data profil dan status petugas catat meter lapangan',
};

export default function PetugasPage() {
  return <KelolaPetugas />;
}
