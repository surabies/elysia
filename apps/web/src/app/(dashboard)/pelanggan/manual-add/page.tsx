import type { Metadata } from 'next';
import { ManualAddPage } from '@/features/dashboard/pelanggan/components/ManualAddPage';

export const metadata: Metadata = {
  title: 'Manual ADD — Input Stand Darurat | Cater PDAM',
  description: 'Input stand meter darurat untuk rumah terkunci, terhalang, dan catatan khusus billing',
};

export default function Page() {
  return <ManualAddPage />;
}
