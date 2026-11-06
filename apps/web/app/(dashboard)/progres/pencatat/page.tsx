import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/index';

export const metadata: Metadata = {
  title: 'Progres Pencatat Meter',
};

export default function ProgresPencatatPage() {
  return <MenuPage href="/progres/pencatat" />;
}
