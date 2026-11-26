import type { Metadata } from 'next';
import { TarifAirView } from '@/features/dashboard/setting-landing';

export const metadata: Metadata = {
  title: 'Pengaturan Struktur Tarif Air | PERUMDA Tirtawening',
  description: 'Konfigurasi tarif air per m³ untuk kelompok golongan pelanggan dan aturan sistem blok konsumsi progresif.',
};

export default function TarifAirPage() {
  return <TarifAirView />;
}
