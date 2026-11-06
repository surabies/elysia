import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Layanan Pengaduan',
};

export default function PengaduanPage() {
  return <MenuPage href="/pengaduan" />;
}
