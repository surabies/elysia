import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Tinjau DRD & Kunci Buku (Tahap 3) | Cater PDAM',
  description: 'Penerbitan rekening resmi air dan penguncian periode penagihan (LOCKED_BILLING)',
};

export default function CreateClosedDrdPage() {
  return <MonitoringTutupBulan initialStep={3} highlightStage="create-closed-drd" />;
}
