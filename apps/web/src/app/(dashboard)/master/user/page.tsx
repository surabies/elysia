import type { Metadata } from 'next';
import { KelolaManajemenUser } from '@/features/dashboard/master/components/KelolaManajemenUser';

export const metadata: Metadata = {
  title: 'Manajemen Akun Pengguna | PDAM Tirtawening',
  description: 'Manajemen akun operator, supervisor, verifikator, dan administrator',
};

export default function MasterUserPage() {
  return <KelolaManajemenUser />;
}
