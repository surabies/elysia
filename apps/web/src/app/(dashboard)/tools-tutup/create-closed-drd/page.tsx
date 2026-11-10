import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Kunci Tutup Buku & Terbitkan Tagihan (Langkah 4) | Cater PDAM',
  description: 'Penerbitan rekening resmi air dan penguncian periode penagihan (LOCKED_BILLING)',
};

export default function CreateClosedDrdPage() {
  return <MonitoringTutupBulan initialStep={4} highlightStage="create-closed-drd" />;
}
