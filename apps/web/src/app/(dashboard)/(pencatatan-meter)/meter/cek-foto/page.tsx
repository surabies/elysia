import type { Metadata } from 'next';
import { MonitoringCekFoto } from '@/features/dashboard/meter';

export const metadata: Metadata = {
  title: 'Cek Foto Meter | PDAM Tirtawening',
  description: 'Audit visual galeri foto bukti fisik meteran air hasil bacaan petugas lapangan',
};

export default function CekFotoPage() {
  return <MonitoringCekFoto />;
}
