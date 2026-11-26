import type { Metadata } from 'next';
import { SimulatorBacaMeter } from '@/features/cater-simulation';

export const metadata: Metadata = {
  title: 'Simulasi Baca | PDAM Tirtawening',
  description: 'Uji coba pembacaan meter, validasi foto, dan deteksi deviasi',
};

export default function CaterSimulationPage() {
  return <SimulatorBacaMeter />;
}
