import type { Metadata } from 'next';
import { auth } from '@/lib/auth/index';
import { MatriksHakAkses } from '@/features/dashboard/master';

export const metadata: Metadata = {
  title: 'Matriks Hak Akses & Ring Approval (RBAC) | PDAM Tirtawening',
  description: 'Matriks perizinan modul dan ring approval verifikasi berdasarkan role',
};

export default async function MasterOtorisasiPage() {
  const session = await auth();
  const userRole = session?.user?.role ?? 'USER';
  const userRoles = session?.user?.roles ?? [];

  return <MatriksHakAkses userRole={userRole} userRoles={userRoles} />;
}
