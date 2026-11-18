// features/dashboard/pengaturan/components/PengaturanCaterView.tsx
// Halaman Mandiri Pengaturan Validasi Catat Meter Lapangan (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PengaturanPageHeader } from './PengaturanPageHeader';
import { TabCatatMeter } from './TabCatatMeter';
import type { CaterConfig } from '../types';

export function PengaturanCaterView() {
  const router = useRouter();
  const [config, setConfig] = React.useState<CaterConfig>({
    radiusGeofence: '50',
    minDurasiPerSL: '15',
    wajibFotoMeter: true,
    blokirMockGps: true,
    autoFlashKamera: true,
  });

  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);

  const triggerToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSimpan = async () => {
    setSedangMenyimpan(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunci: 'cater_config',
          nilai: config,
          kategori: 'cater',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan konfigurasi.');

      triggerToast(
        'Parameter Catat Meter Disimpan',
        'Toleransi geofence GPS, durasi baca per SL, dan proteksi mock GPS berhasil diperbarui.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_CATER_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  const handleResetDefault = () => {
    setConfig({
      radiusGeofence: '50',
      minDurasiPerSL: '15',
      wajibFotoMeter: true,
      blokirMockGps: true,
      autoFlashKamera: true,
    });
    triggerToast('Reset Default', 'Parameter catat meter dikembalikan ke standar SOP resmi.');
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PengaturanPageHeader
          title="Pengaturan Parameter Catat Meter"
          description="Konfigurasi radius toleransi geofence PostGIS, durasi minimal pembacaan per SL, kewajiban bukti foto, dan proteksi mock GPS."
          badge="Modul Mandiri Catat Meter"
          onResetDefault={handleResetDefault}
          onSimpan={handleSimpan}
          sedangMenyimpan={sedangMenyimpan}
        />

        {toastMessage && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-sm ${
                toastMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-800 border-rose-500/25 dark:text-rose-300'
                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:text-emerald-300'
              }`}
            >
              {toastMessage.type === 'error' ? (
                <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{toastMessage.title}</span>
                <span className="text-xs opacity-90">{toastMessage.desc}</span>
              </div>
            </div>
          </div>
        )}

        <TabCatatMeter
          config={config}
          onChange={(key, val) => setConfig((prev) => ({ ...prev, [key]: val }))}
        />
      </div>
    </PageContainer>
  );
}
