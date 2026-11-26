// features/dashboard/pengaturan/components/PengaturanVerifikasiView.tsx
// Halaman Mandiri Pengaturan Verifikasi Anomali & Ambang Deviasi (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PengaturanPageHeader } from './PengaturanPageHeader';
import { TabVerifikasiStand } from './TabVerifikasiStand';
import type { VerifikasiConfig } from '../types';

export function PengaturanVerifikasiView() {
  const router = useRouter();
  const [config, setConfig] = React.useState<VerifikasiConfig>({
    metodeTaksasiDefault: 'RATA_3_BULAN',
    cutOffClosingDate: '24',
    cutOffClosingHour: '23:59',
    wajibCatatanKoreksi: true,
    ambangDeviasiRing1: '30',
    ambangDeviasiRing2: '100',
    ambangDeviasiRing3: '250',
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
          kunci: 'verifikasi_config',
          nilai: config,
          kategori: 'verifikasi',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan konfigurasi.');

      triggerToast(
        'Parameter Verifikasi Disimpan',
        'Metode taksasi default, cut-off closing, dan ambang deviasi anomali berhasil diperbarui.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_VERIFIKASI_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  const handleResetDefault = () => {
    setConfig({
      metodeTaksasiDefault: 'RATA_3_BULAN',
      cutOffClosingDate: '24',
      cutOffClosingHour: '23:59',
      wajibCatatanKoreksi: true,
      ambangDeviasiRing1: '30',
      ambangDeviasiRing2: '100',
      ambangDeviasiRing3: '250',
    });
    triggerToast('Reset Default', 'Parameter verifikasi dikembalikan ke standar SOP resmi.');
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PengaturanPageHeader
          title="Pengaturan Verifikasi Stand & Ambang Deviasi"
          description="Konfigurasi metode taksasi default jika meter mati, batas waktu cut-off closing periode, serta rentang persentase deviasi anomali Ring 1, 2, dan 3."
          badge="Modul Mandiri Verifikasi"
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

        <TabVerifikasiStand
          config={config}
          onChange={(key, val) => setConfig((prev) => ({ ...prev, [key]: val }))}
        />
      </div>
    </PageContainer>
  );
}
