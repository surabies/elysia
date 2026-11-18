import type { Metadata } from 'next';
import { BeritaPengumumanView } from '@/features/dashboard/setting-landing';

export const metadata: Metadata = {
  title: 'Pengaturan Berita & Pengumuman Publik | PERUMDA Tirtawening',
  description: 'Kelola artikel berita, rilis kegiatan pers, tanggal terbit, dan pengumuman resmi PDAM Tirtawening Kota Bandung.',
};

export default function BeritaPengumumanPage() {
  return <BeritaPengumumanView />;
}
