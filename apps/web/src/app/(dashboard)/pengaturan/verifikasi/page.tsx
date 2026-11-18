import type { Metadata } from 'next';
import { PengaturanVerifikasiView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Verifikasi Stand & Ambang Deviasi | PERUMDA Tirtawening',
  description: 'Konfigurasi metode taksasi default, batas waktu cut-off closing periode, dan ambang deviasi anomali Ring 1, 2, dan 3.',
};

export default function PengaturanVerifikasiPage() {
  return <PengaturanVerifikasiView />;
}
