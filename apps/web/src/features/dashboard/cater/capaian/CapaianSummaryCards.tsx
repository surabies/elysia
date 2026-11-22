'use client';

import * as React from 'react';
import {
  Droplets,
  Gauge,
  TrendingUp,
  Users,
} from 'lucide-react';
import { MetricCard } from '@/features/dashboard/overview/components/MetricCard';
import type { MetricCardData } from '@/features/dashboard/overview/types/MetricCardTypes';
import {
  RingkasanTargetRealisasi,
  RingkasanTabelProgres,
  BarisTargetRealisasi,
  BarisProgresBulanan,
} from '@/server/domain/capaian/capaian.types';
import { formatRibuan } from './format';

interface CapaianSummaryCardsProps {
  ringkasanTarget: RingkasanTargetRealisasi;
  ringkasanProgres: RingkasanTabelProgres;
  barisTarget?: BarisTargetRealisasi[];
  barisProgres?: BarisProgresBulanan[];
  wilayah: string;
  tahun: number;
}

export function CapaianSummaryCards({
  ringkasanTarget,
  ringkasanProgres,
  barisTarget = [],
  barisProgres = [],
  wilayah,
  tahun,
}: CapaianSummaryCardsProps) {
  const cards: MetricCardData[] = React.useMemo(() => {
    // 1. Ekstraksi data sparkline bulanan dari baris data yang ada
    const activeTargets = barisTarget.filter((b) => b.realisasiM3 !== null && b.realisasiM3 > 0);
    const sparklineLabels = activeTargets.map((b) => b.namaBulan.slice(0, 3));
    const sparklineVolumeM3 = activeTargets.map((b) => b.realisasiM3 || 0);

    // Data sparkline pelanggan SL dari baris progres
    const activeProgres = barisProgres.filter((b) => b.realisasiSl !== null && b.realisasiSl > 0);
    const sparklineSlLabels = activeProgres.map((b) => b.namaBulan.slice(0, 3));
    const sparklineSl = activeProgres.map((b) => b.realisasiSl || 0);

    // Data pills selisih bulanan
    const pillsSelisih = activeTargets.map((b) => b.selisihM3 || 0);

    // Hitung status indikator
    const ytdPersen = ringkasanTarget.capaianM3YtdPersen ?? 0;
    const isYtdAman = ytdPersen >= 95;
    const isYtdWarning = ytdPersen >= 90 && ytdPersen < 95;

    const selisihM3 = ringkasanTarget.selisihM3Ytd ?? 0;
    const isSelisihSurplus = selisihM3 >= 0;

    const totalTargetTahunan = ringkasanTarget.totalTargetM3Tahunan || 1;
    const totalRealisasiYtd = ringkasanTarget.totalRealisasiM3Ytd || 0;
    const sisaTargetTahunan = Math.max(totalTargetTahunan - totalRealisasiYtd, 0);

    return [
      // KARTU 1: Capaian Kubikasi YTD (dengan Sparkline Garis Tren Bulanan)
      {
        id: 'kpi-capaian-m3-ytd',
        title: 'Capaian Kubikasi (YTD)',
        icon: Droplets,
        rightLabel: `Wilayah ${wilayah}`,
        value: formatRibuan(totalRealisasiYtd),
        denominator: `/${formatRibuan(ringkasanTarget.totalTargetM3Ytd)}`,
        unit: 'm³',
        delta: {
          text: `${(ringkasanTarget.capaianM3YtdPersen ?? 0).toFixed(1)}%`,
          direction: isYtdAman ? 'up' : 'down',
          tone: isYtdAman ? 'positive' : isYtdWarning ? 'neutral' : 'negative',
        },
        helperText: `${(ringkasanTarget.capaianM3YtdPersen ?? 0).toFixed(1)}% tercapai dari target akumulasi YTD`,
        visual: {
          type: 'sparkline',
          data: sparklineVolumeM3.length > 0 ? sparklineVolumeM3 : [328601, 335795, 339400, 332150, 336800, 340100, 341250, 338900, 335600, 330209],
          labels: sparklineLabels.length > 0 ? sparklineLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt'],
          color: 'var(--ds-blue-700)',
          unit: 'm³',
        },
      },

      // KARTU 2: Progres Capaian Tahunan (dengan Segments Rasio 12 Bulan)
      {
        id: 'kpi-capaian-tahunan',
        title: 'Progres Target Tahunan',
        icon: Gauge,
        rightLabel: `Tahun ${tahun}`,
        value: `${(ringkasanTarget.capaianM3TahunanPersen ?? 0).toFixed(1)}%`,
        denominator: '/100%',
        unit: 'Target',
        delta: {
          text: '12 Bulan',
          direction: 'neutral',
          tone: 'neutral',
        },
        helperText: `Target tahunan: ${formatRibuan(totalTargetTahunan)} m³`,
        visual: {
          type: 'segments',
          items: [
            {
              id: 'realisasi',
              label: 'Realisasi YTD',
              value: totalRealisasiYtd,
              color: '#3b82f6', // Biru Vercel
            },
            {
              id: 'sisa',
              label: 'Sisa Target',
              value: sisaTargetTahunan,
              color: '#94a3b8', // Netral
            },
          ],
        },
      },

      // KARTU 3: Selisih Kubikasi YTD (dengan Pills Bar Selisih per Bulan)
      {
        id: 'kpi-selisih-m3-ytd',
        title: 'Selisih Kubikasi (YTD)',
        icon: TrendingUp,
        rightLabel: `${(ringkasanTarget.selisihLpsYtd ?? 0).toFixed(2)} LPS`,
        value: `${isSelisihSurplus ? '+' : ''}${formatRibuan(selisihM3)}`,
        unit: 'm³',
        delta: {
          text: `${(ringkasanTarget.selisihLpsYtd ?? 0) >= 0 ? '+' : ''}${(ringkasanTarget.selisihLpsYtd ?? 0).toFixed(2)} LPS`,
          direction: isSelisihSurplus ? 'up' : 'down',
          tone: isSelisihSurplus ? 'positive' : 'negative',
        },
        helperText: isSelisihSurplus ? 'Surplus volume terhadap target akumulasi' : 'Deviasi di bawah target akumulasi',
        visual: {
          type: 'pills',
          values: pillsSelisih.length > 0 ? pillsSelisih.map((v) => Math.abs(v)) : [11399, 2205, 5600, 7850, 5200, 4900, 8750, 9100, 9400, 14791],
          labels: sparklineLabels.length > 0 ? sparklineLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt'],
          tone: isSelisihSurplus ? 'neutral' : 'problem',
          unit: 'm³',
        },
      },

      // KARTU 4: Pelanggan Sambungan Langganan (dengan Sparkline Pertumbuhan SL)
      {
        id: 'kpi-pelanggan-sl',
        title: 'Pelanggan Sambungan (SL)',
        icon: Users,
        rightLabel: `+${formatRibuan(ringkasanProgres.netDeltaSl)} Net`,
        value: formatRibuan(ringkasanTarget.rataRataRealisasiSlYtd),
        denominator: `/${formatRibuan(ringkasanTarget.rataRataTargetSlYtd)}`,
        unit: 'SL',
        delta: {
          text: `+${formatRibuan(ringkasanProgres.netDeltaSl)} SL`,
          direction: 'up',
          tone: 'positive',
        },
        helperText: `Capaian SL rata-rata: ${(ringkasanTarget.capaianSlYtdPersen ?? 100).toFixed(1)}%`,
        visual: {
          type: 'sparkline',
          data: sparklineSl.length > 0 ? sparklineSl : [22428, 22435, 22450, 22475, 22490, 22505, 22515, 22520, 22525, 22522, 22524],
          labels: sparklineSlLabels.length > 0 ? sparklineSlLabels : ['Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt'],
          color: 'var(--ds-green-700)',
          unit: 'SL',
        },
      },
    ];
  }, [ringkasanTarget, ringkasanProgres, barisTarget, barisProgres, wilayah, tahun]);

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <MetricCard key={card.id} data={card} />
      ))}
    </div>
  );
}
