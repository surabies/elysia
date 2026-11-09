import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing/components/MonitoringTutupBulan';

export const metadata: Metadata = {
  title: 'Posting Datameter (Tahap 4) | Cater PDAM',
  description: 'Publikasi dan approval hasil verifikasi pembacaan meter mobile ke billing ledger',
};

export default function PostingDatameterPage() {
  return <MonitoringTutupBulan initialTab="pipeline" highlightStage="posting-datameter" />;
}
