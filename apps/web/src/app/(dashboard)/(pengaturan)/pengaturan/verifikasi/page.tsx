import type { Metadata } from 'next';
import { PengaturanAturanAnomaliView } from '@/features/dashboard/pengaturan';

export const metadata: Metadata = {
  title: 'Pengaturan Verifikasi Stand & Aturan Anomali | PERUMDA Tirtawening',
  description: 'Konfigurasi SSOT aturan evaluasi anomali, klasifikasi TMSS, metode taksasi default, dan ambang deviasi Ring 1, 2, dan 3.',
};

export default function PengaturanVerifikasiPage() {
  return (
    <div className="h-full w-full flex-1 min-h-0 flex flex-col overflow-hidden">
      <PengaturanAturanAnomaliView />
    </div>
  );
}
