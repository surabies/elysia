import type { Metadata } from 'next';
import { CekSelisihPelanggan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Cek Selisih Pelanggan | Tutup Bulan Cater PDAM',
  description: 'Audit rekonsiliasi matematis 4 pilar: Master Pelanggan, DPM Target, Realisasi Bacaan, dan Rekening DRD',
};

export default function CekSelisihPelangganPage() {
  return <CekSelisihPelanggan />;
}
