import type { Metadata } from 'next';
import { auth } from '@/lib/auth/index';
import { KelolaManajemenUser } from '@/features/dashboard/master';

export const metadata: Metadata = {
  title: 'Manajemen Akun Pengguna & Hak Akses | PDAM Tirtawening',
  description: 'Manajemen akun operator, supervisor, verifikator, staf billing, dan administrator sistem',
};

export default async function MasterUserPage() {
  const session = await auth();
  const userRole = session?.user?.role ?? 'USER';
  const userRoles = session?.user?.roles ?? [];

  return <KelolaManajemenUser userRole={userRole} userRoles={userRoles} />;
}
