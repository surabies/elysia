import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Pengaturan Sistem',
};

export default function PengaturanPage() {
  return <MenuPage href="/pengaturan" />;
}
