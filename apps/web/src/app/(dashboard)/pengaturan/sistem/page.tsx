import type { Metadata } from 'next';
import { PengaturanSistemView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Preferensi Sistem & Audit Trail | PERUMDA Tirtawening',
  description: 'Konfigurasi kepadatan tampilan tabel, suara notifikasi anomali, dan kelengkapan catatan audit trail log.',
};

export default function PengaturanSistemPage() {
  return <PengaturanSistemView />;
}
