import type { Metadata } from 'next';
import { PengaturanCaterView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Parameter Catat Meter | PERUMDA Tirtawening',
  description: 'Konfigurasi radius toleransi geofence GPS, durasi baca per SL, wajib bukti foto, dan proteksi mock GPS.',
};

export default function PengaturanCaterPage() {
  return <PengaturanCaterView />;
}
