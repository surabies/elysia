import type { Metadata } from 'next';
import { ManualAddPage } from '@/features/dashboard/pelanggan';

export const metadata: Metadata = {
  title: 'Hitung Rata-Rata (Taksasi 3 Bulan) | Cater PDAM',
  description:
    'Kalkulasi otomatis taksasi pemakaian air berdasarkan histori rata-rata 3 bulan terakhir untuk penyelesaian cakupan DPM',
};

export default function HitungRataRataPage() {
  return <ManualAddPage />;
}
