import type { Metadata } from 'next';
import { PengaturanView } from '@/features/dashboard/pengaturan/components/PengaturanView';

export const metadata: Metadata = {
  title: 'Pengaturan & Preferensi Sistem | Cater PDAM Tirtawening',
  description: 'Konfigurasi profil operator, toleransi geofence pembacaan meter, dan parameter penagihan air',
};

export default function PengaturanPage() {
  return <PengaturanView />;
}
