import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Kelola Petugas',
};

export default function PetugasPage() {
  return <MenuPage href="/master/petugas" />;
}
