import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Create Closed DRD (Tahap 5) | Cater PDAM',
  description: 'Penerbitan rekening resmi air dan penguncian periode penagihan (LOCKED_BILLING)',
};

export default function CreateClosedDrdPage() {
  return <MonitoringTutupBulan initialTab="pipeline" highlightStage="create-closed-drd" />;
}
