import type { Metadata } from 'next';
import { PengaturanBillingView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Billing & Tarif Denda | PERUMDA Tirtawening',
  description: 'Konfigurasi biaya administrasi rekening, biaya pemeliharaan meter air per golongan, tanggal jatuh tempo, dan denda.',
};

export default function PengaturanBillingPage() {
  return <PengaturanBillingView />;
}
