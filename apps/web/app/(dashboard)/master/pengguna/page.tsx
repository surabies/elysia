import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Kelola Pengguna',
};

export default function PenggunaPage() {
  return <MenuPage href="/master/pengguna" />;
}
