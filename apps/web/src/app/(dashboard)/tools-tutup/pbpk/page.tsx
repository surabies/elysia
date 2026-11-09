import type { Metadata } from 'next';
import { PbpkView } from '@/features/dashboard/closing/components/PbpkView';

export const metadata: Metadata = {
  title: 'PBPK (Pasang Baru & Perubahan Kategori) | Tutup Bulan Cater PDAM',
  description: 'Pendaftaran sambungan baru (PB) dan perubahan golongan tarif (PK) untuk siklus penagihan berikutnya',
};

export default function PbpkPage() {
  return <PbpkView />;
}
