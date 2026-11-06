import type { Metadata } from 'next';
import { MenuPage } from '@/components/layout/index';

export const metadata: Metadata = {
  title: 'Struktur Tarif & Harga Air',
};

export default function TarifPage() {
  return <MenuPage href="/tarif" />;
}
