import { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { CapaianPencatatanView } from '@/features/dashboard/cater/capaian/CapaianPencatatanView';

export const metadata: Metadata = {
  title: 'Capaian Pencatatan — PDAM Tirtawening',
  description:
    'Monitoring dan evaluasi target vs realisasi sambungan langganan (SL), kubikasi M³, LPS, dan capaian tahunan pembacaan meter.',
};

export default function CapaianPencatatanPage() {
  return (
    <PageContainer className="space-y-6">
      <CapaianPencatatanView />
    </PageContainer>
  );
}
