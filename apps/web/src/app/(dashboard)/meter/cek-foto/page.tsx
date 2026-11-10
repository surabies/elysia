import type { Metadata } from 'next';
import { MonitoringCekFoto } from '@/features/dashboard/meter';

export const metadata: Metadata = {
  title: 'Audit & Cek Foto Petugas | Cater PDAM',
  description: 'Galeri foto angka meter dan rumah pelanggan hasil perekaman petugas lapangan',
};

export default function CekFotoPage() {
  return <MonitoringCekFoto />;
}
