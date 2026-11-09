import type { Metadata } from 'next';
import { KelolaUrutanRute } from '@/features/dashboard/master/components/KelolaUrutanRute';

export const metadata: Metadata = {
  title: 'Urutan Langkah Rute (DPM) | PDAM Tirtawening',
  description: 'Pengaturan urutan langkah gang dan sekuensial pembacaan meter pelanggan',
};

export default function MasterUrutPage() {
  return <KelolaUrutanRute />;
}
