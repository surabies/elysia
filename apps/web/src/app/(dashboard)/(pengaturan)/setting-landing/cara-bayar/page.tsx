import type { Metadata } from 'next';
import { CaraBayarView } from '@/features/dashboard/setting-landing';

export const metadata: Metadata = {
  title: 'Pengaturan Cara Pembayaran & Kanal Mitra | PERUMDA Tirtawening',
  description: 'Konfigurasi panduan langkah pembayaran rekening air, daftar perbankan/fintech mitra, dan info batas jatuh tempo.',
};

export default function CaraBayarPage() {
  return <CaraBayarView />;
}
