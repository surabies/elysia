import type { Metadata } from 'next';
import { LaporanMonitoringKoreksi } from '@/features/dashboard/laporan';

export const metadata: Metadata = {
  title: 'Laporan Monitoring Kubikasi Koreksi | PDAM Tirtawening',
  description: 'Rekapitulasi audit trail selisih kubikasi dan koreksi angka stand meter',
};

export default function MonitoringKoreksiPage() {
  return <LaporanMonitoringKoreksi />;
}
