import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PenggabunganRuteView } from '@/features/dashboard/rute';

export const metadata: Metadata = {
  title: 'Kelola Rute Pencatatan Petugas | PDAM Tirtawening',
  description: 'Gabungkan atau pindahkan pelanggan dari satu rute baca ke rute petugas lain.',
};

export default function PenggabunganRutePage() {
  return (
    <PageContainer className="space-y-6">
      <PenggabunganRuteView />
    </PageContainer>
  );
}
