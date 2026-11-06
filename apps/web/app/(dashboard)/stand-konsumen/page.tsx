import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/index';

export const metadata: Metadata = {
  title: 'Stand Mandiri Konsumen',
};

export default function StandKonsumenPage() {
  return <MenuPage href="/stand-konsumen" />;
}
