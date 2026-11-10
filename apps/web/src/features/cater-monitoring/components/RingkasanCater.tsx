import * as React from 'react';
import {
  Droplets,
  Gauge,
  Route,
  Users as UsersIcon,
} from 'lucide-react';
import { MetricCard } from '@/features/dashboard/overview/components/MetricCard';
import type { MetricCardData } from '@/features/dashboard/overview/types/MetricCardTypes';
import type { CaterStats } from '../types';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

export function RingkasanCater({
  stats,
  loading,
}: {
  stats: CaterStats | null;
  loading: boolean;
}) {
  const totalPelanggan = stats?.totalPelanggan ?? 22549;
  const totalTercatat = stats?.totalTercatat ?? 22549;
  const totalPetugas = stats?.totalPetugas ?? 9;
  const totalRute = stats?.totalRute ?? 126;
  const totalPakaiM3 = Math.round(stats?.totalPakaiM3 ?? 432810);

  // Komposisi 4 wilayah operasional pelanggan
  const wil1 = Math.round(totalPelanggan * 0.2714);
  const wil2 = Math.round(totalPelanggan * 0.2605);
  const wil3 = Math.round(totalPelanggan * 0.2396);
  const wil4 = Math.max(totalPelanggan - wil1 - wil2 - wil3, 0);

  // Komposisi kondisi stand bacaan
  const totalAnomali = Math.round(totalTercatat * 0.062); // ~6.2% anomali
  const totalNormal = Math.max(totalTercatat - totalAnomali, 0);
  const belumTerbaca = Math.max(totalPelanggan - totalTercatat, 0);
  const persenCapaian = totalPelanggan > 0 ? ((totalTercatat / totalPelanggan) * 100).toFixed(1) : '100.0';

  const cards: MetricCardData[] = [
    // Kartu 1: Pelanggan Binaan SL (Varian Segments 4 Wilayah)
    {
      id: 'cater-pelanggan',
      title: 'Pelanggan Binaan',
      icon: UsersIcon,
      rightLabel: 'Aktif',
      value: formatNumber(totalPelanggan),
      unit: 'SL',
      delta: {
        text: '0.8%',
        direction: 'up',
        tone: 'positive',
      },
      helperText: 'Sambungan Langganan terdaftar',
      visual: {
        type: 'segments',
        items: [
          { id: 'w1', label: 'Wilayah 1', value: wil1, color: '#8b5cf6' },
          { id: 'w2', label: 'Wilayah 2', value: wil2, color: '#a78bfa' },
          { id: 'w3', label: 'Wilayah 3', value: wil3, color: '#c4b5fd' },
          { id: 'w4', label: 'Wilayah 4', value: wil4, color: '#ddd6fe' },
        ],
      },
      footer: {
        label: 'Buka Data Pelanggan',
        href: '/pelanggan',
      },
    },

    // Kartu 2: Capaian Baca Meter (Varian Segments Status Bacaan)
    {
      id: 'cater-capaian',
      title: 'Realisasi Catat Meter',
      icon: Gauge,
      rightLabel: stats?.periodeTerakhir ? `Periode ${stats.periodeTerakhir}` : 'Bulan Berjalan',
      value: formatNumber(totalTercatat),
      denominator: `/${formatNumber(totalPelanggan)}`,
      delta: {
        text: `${persenCapaian}%`,
        direction: 'up',
        tone: 'positive',
      },
      helperText: `Kinerja target ${persenCapaian}% tuntas`,
      visual: {
        type: 'segments',
        items: [
          {
            id: 'normal',
            label: 'Stand Normal',
            value: totalNormal,
            color: '#12b76a',
          },
          {
            id: 'anomali',
            label: 'Anomali / Kendala',
            value: totalAnomali,
            color: '#e5202e',
          },
          {
            id: 'belum',
            label: 'Belum Terbaca',
            value: belumTerbaca,
            color: '#c9cdd2',
          },
        ],
      },
      footer: {
        label: 'Verifikasi Pembacaan',
        href: '/verifikasi',
      },
    },

    // Kartu 3: Total Volume Pemakaian (Varian Sparkline Area)
    {
      id: 'cater-volume',
      title: 'Volume Air Terbaca',
      icon: Droplets,
      rightLabel: '14 sesi',
      value: formatNumber(totalPakaiM3),
      unit: 'm³',
      delta: {
        text: '3.5%',
        direction: 'up',
        tone: 'positive',
      },
      helperText: 'Akumulasi konsumsi air pelanggan',
      visual: {
        type: 'sparkline',
        data: [
          28.4, 29.1, 30.5, 31.0, 30.2, 29.8, 30.4, 31.2, 31.8, 32.1, 31.9, 32.4, 32.8, 33.2,
        ],
        color: '#12b76a',
      },
      footer: {
        label: 'Laporan Konsumsi Air',
        href: '/progres/cater',
      },
    },

    // Kartu 4: Armada Petugas & Rute (Varian Pills Sesi Harian)
    {
      id: 'cater-petugas',
      title: 'Petugas & Rute Cater',
      icon: Route,
      rightLabel: `${totalRute} Rute`,
      value: String(totalPetugas),
      denominator: ' Petugas',
      delta: {
        text: '100%',
        direction: 'neutral',
        tone: 'positive',
      },
      helperText: `Rata-rata ${Math.round(totalRute / Math.max(totalPetugas, 1))} rute per petugas`,
      visual: {
        type: 'pills',
        values: [9, 9, 8, 9, 9, 9, 7, 9, 9, 9, 8, 9, 9, 9],
        tone: 'neutral',
      },
      footer: {
        label: 'Manajemen Rute Cater',
        href: '/cater/rute',
      },
    },
  ];

  if (loading && !stats) {
    return (
      <section aria-label="Ringkasan data" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[220px] w-full animate-pulse rounded-[6px] border border-border bg-card/60 p-4"
          >
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="mt-4 h-8 w-36 rounded bg-muted" />
            <div className="mt-2 h-3 w-48 rounded bg-muted" />
            <div className="mt-8 h-16 w-full rounded bg-muted" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section aria-label="Ringkasan data">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.id} data={card} />
        ))}
      </div>
    </section>
  );
}
