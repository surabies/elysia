import type { Metadata } from 'next';
import { PanduanClosingView } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Peta 12 Modul & Panduan Lengkap Tutup Buku | Cater PDAM',
  description:
    'Dokumentasi teknis, skema arsitektur 4 fase, rumus kalkulasi progresif DRD, dan peta status 12 modul tutup bulan penagihan air',
};

export default function PanduanClosingPage() {
  return <PanduanClosingView />;
}
