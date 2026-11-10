import type { Metadata } from 'next';
import { LaporanKelainanMeter } from '@/features/dashboard/laporan';

export const metadata: Metadata = {
  title: 'Laporan Rekapitulasi Kelainan Meter | PDAM Tirtawening',
  description: 'Rekapitulasi 17 jenis kelainan meter, kendala akses, dan anomali fisik',
};

export default function LapKelainanMeterPage() {
  return <LaporanKelainanMeter />;
}
