import type { Metadata } from 'next';
import { PasangBaruView } from '@/features/dashboard/setting-landing';

export const metadata: Metadata = {
  title: 'Pengaturan Syarat Pasang Baru | PERUMDA Tirtawening',
  description: 'Konfigurasi berkas persyaratan, alur pendaftaran teknis, dan informasi biaya sambungan air baru.',
};

export default function PasangBaruPage() {
  return <PasangBaruView />;
}
