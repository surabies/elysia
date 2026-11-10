import {
  DollarSign,
  Droplet,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { MetricStatCard } from '@/features/dashboard/shared/components';
import {
  calculateVerificationRate,
  formatAngkaId,
  formatRupiahId,
} from '../lib/closing-format';
import type { PratinjauData } from '../types';

interface ClosingKpiGridProps {
  pratinjau: PratinjauData | null;
  loading: boolean;
}

export function ClosingKpiGrid({ pratinjau, loading }: ClosingKpiGridProps) {
  const approvalRate = calculateVerificationRate(
    pratinjau?.verifikasi.selesaiV3,
    pratinjau?.verifikasi.total,
  );

  return (
    <section
      aria-label="Metrik kesiapan tutup bulan"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      <MetricStatCard
        label="Total Pelanggan Aktif"
        value={loading ? '—' : formatAngkaId(pratinjau?.daftarCatat.total ?? 0)}
        unit="SL"
        description="Target buku daftar catat"
        icon={Users}
      />

      <MetricStatCard
        label="Read Rate Lapangan"
        value={
          loading ? '—' : `${pratinjau?.daftarCatat.readRatePersen ?? 100}%`
        }
        unit="tercatat"
        description="Realisasi pembacaan petugas"
        icon={Droplet}
        tone="success"
      />

      <MetricStatCard
        label="Approval Verifikasi"
        value={loading ? '—' : `${approvalRate}%`}
        unit="disahkan"
        description="Pengesahan siklus V1-V3"
        icon={ShieldCheck}
      />

      <MetricStatCard
        label="Volume Air (DRD)"
        value={loading ? '—' : formatAngkaId(pratinjau?.perkiraan.totalM3 ?? 0)}
        unit="m³"
        description="Total kubikasi ditagihkan"
        icon={Droplet}
      />

      <MetricStatCard
        label="Omzet DRD Resmi"
        value={
          loading ? '—' : formatRupiahId(pratinjau?.perkiraan.totalTagihan ?? 0)
        }
        description="Proyeksi nilai rekening air"
        icon={DollarSign}
        tone="subtle"
      />
    </section>
  );
}
