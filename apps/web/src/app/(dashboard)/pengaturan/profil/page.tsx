import type { Metadata } from 'next';
import { PengaturanAkunView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Profil Akun & Operator | PERUMDA Tirtawening',
  description: 'Konfigurasi profil petugas, NPP, foto identitas avatar, penugasan wilayah pelayanan, dan kata sandi akun.',
};

export default function PengaturanAkunPage() {
  return <PengaturanAkunView />;
}
