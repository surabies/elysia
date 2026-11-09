import type { Metadata } from 'next';
import { MatriksHakAkses } from '@/features/dashboard/master/components/MatriksHakAkses';

export const metadata: Metadata = {
  title: 'Matriks Hak Akses & Otorisasi RBAC | PDAM Tirtawening',
  description: 'Matriks perizinan modul dan ring approval verifikasi berdasarkan role',
};

export default function MasterOtorisasiPage() {
  return <MatriksHakAkses />;
}
