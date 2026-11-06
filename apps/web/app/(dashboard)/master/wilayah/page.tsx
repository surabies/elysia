import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Kelola Wilayah',
};

export default function WilayahPage() {
  return <MenuPage href="/master/wilayah" />;
}
