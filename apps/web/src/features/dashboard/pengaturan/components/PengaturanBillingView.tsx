// features/dashboard/pengaturan/components/PengaturanBillingView.tsx
// Halaman Mandiri Pengaturan Parameter Billing DRD & Denda (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PengaturanPageHeader } from './PengaturanPageHeader';
import { TabBillingDrd } from './TabBillingDrd';
import type { BillingDrdConfig } from '../types';

export function PengaturanBillingView() {
  const router = useRouter();
  const [config, setConfig] = React.useState<BillingDrdConfig>({
    beaAdminDefault: '2500',
    beaPemeliharaanRT: '8000',
    beaPemeliharaanNiaga: '15000',
    beaPemeliharaanIndustri: '25000',
    tanggalJatuhTempo: '20',
    skemaDenda: 'FLAT_PER_BULAN',
    nominalDendaFlat: '10000',
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
          kunci: 'billing_config',
          nilai: config,
          kategori: 'billing',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan konfigurasi.');

      triggerToast(
        'Parameter Billing DRD Disimpan',
        'Bea administrasi, bea pemeliharaan per golongan, dan aturan denda keterlambatan berhasil diperbarui.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_BILLING_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  const handleResetDefault = () => {
    setConfig({
      beaAdminDefault: '2500',
      beaPemeliharaanRT: '8000',
      beaPemeliharaanNiaga: '15000',
      beaPemeliharaanIndustri: '25000',
      tanggalJatuhTempo: '20',
      skemaDenda: 'FLAT_PER_BULAN',
      nominalDendaFlat: '10000',
    });
    triggerToast('Reset Default', 'Parameter billing dikembalikan ke standar SOP resmi.');
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PengaturanPageHeader
          title="Pengaturan Parameter Billing & Tarif Denda"
          description="Konfigurasi tarif administrasi rekening air, biaya pemeliharaan meter air per kelompok pelanggan, tanggal jatuh tempo, dan skema denda."
          badge="Modul Mandiri Billing DRD"
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

        <TabBillingDrd
          config={config}
          onChange={(key, val) => setConfig((prev) => ({ ...prev, [key]: val }))}
        />
      </div>
    </PageContainer>
  );
}
