import type { Metadata } from 'next';
import { MonitoringTutupBulan } from '@/features/dashboard/closing';

export const metadata: Metadata = {
  title: 'Pengesahan Bacaan Meter (Langkah 2) | Cater PDAM',
  description: 'Publikasi dan approval hasil verifikasi pembacaan meter mobile ke billing ledger',
};

export default function PostingDatameterPage() {
  return <MonitoringTutupBulan initialStep={2} highlightStage="posting-datameter" />;
}
