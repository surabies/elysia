import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Pemetaan Rute',
};

export default function UrutPage() {
  return <MenuPage href="/master/urut" />;
}
