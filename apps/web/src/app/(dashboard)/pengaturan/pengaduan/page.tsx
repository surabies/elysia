import type { Metadata } from 'next';
import { PengaturanPengaduanView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Layanan Pengaduan & GWM | PERUMDA Tirtawening',
  description: 'Konfigurasi target SLA perbaikan pipa bocor, alur SPK otomatis meter macet, dan integrasi WhatsApp Gateway.',
};

export default function PengaturanPengaduanPage() {
  return <PengaturanPengaduanView />;
}
