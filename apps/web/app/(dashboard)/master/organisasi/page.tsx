import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/page/MenuPage';

export const metadata: Metadata = {
  title: 'Struktur Organisasi (SOTK)',
};

export default function OrganisasiPage() {
  return <MenuPage href="/master/organisasi" />;
}
