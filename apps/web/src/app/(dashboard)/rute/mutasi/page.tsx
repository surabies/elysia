import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { MutasiRuteView } from '@/features/dashboard/rute';

export const metadata: Metadata = {
  title: 'Mutasi Rute Pelanggan | PDAM Tirtawening',
  description: 'Pindahkan satu pelanggan ke rute baca dan nomor urut baru.',
};

export default function MutasiRutePage() {
  return (
    <PageContainer className="space-y-6">
      <MutasiRuteView />
    </PageContainer>
  );
}
