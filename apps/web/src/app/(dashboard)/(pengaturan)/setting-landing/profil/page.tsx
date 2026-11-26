import type { Metadata } from 'next';
import { ProfilKontakView } from '@/features/dashboard/setting-landing';

export const metadata: Metadata = {
  title: 'Pengaturan Profil Perusahaan & Kontak Cabang | PERUMDA Tirtawening',
  description: 'Konfigurasi identitas resmi perusahaan, visi misi, sejarah, alamat kantor pusat, call center, dan 6 kantor pelayanan wilayah.',
};

export default function ProfilKontakPage() {
  return <ProfilKontakView />;
}
