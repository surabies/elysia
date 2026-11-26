import type { Metadata } from 'next';
import { LaporanEvaluasiPetugas } from '@/features/dashboard/laporan';

export const metadata: Metadata = {
  title: 'Laporan Evaluasi Kinerja Petugas Cater | PDAM Tirtawening',
  description: 'Evaluasi produktivitas, ketepatan waktu, dan akurasi 9 petugas cater lapangan',
};

export default function EvaluasiPetugasPage() {
  return <LaporanEvaluasiPetugas />;
}
