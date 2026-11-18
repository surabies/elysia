// features/dashboard/setting-landing/components/TarifAirView.tsx
// Halaman Mandiri Pengaturan Struktur Tarif Air Perumda Tirtawening (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { StrukturTarifData } from '@/types/pengaturan-konten';

const DEFAULT_TARIF: StrukturTarifData = {
  judul: 'Struktur Tarif Pemakaian Air Minum',
  deskripsi:
    'Struktur tarif pemakaian air minum perpipaan berdasarkan kelompok golongan pelanggan dan blok konsumsi progresif PERUMDA Tirtawening.',
  tarif: [
    {
      golongan: 'Kelompok I (Sosial)',
      keterangan: 'Kran umum, tempat ibadah, panti asuhan, sekolah negeri',
      tarif: 'Rp 1.050 – Rp 1.500 / m³',
    },
    {
      golongan: 'Kelompok IIA (Rumah Tangga Sederhana)',
      keterangan: 'Rumah tinggal non-permanen / sederhana daya listrik s/d 900 VA',
      tarif: 'Rp 2.200 – Rp 4.100 / m³',
    },
    {
      golongan: 'Kelompok IIB (Rumah Tangga Menengah)',
      keterangan: 'Rumah tinggal permanen daya listrik 1300 VA s/d 2200 VA',
      tarif: 'Rp 3.500 – Rp 6.800 / m³',
    },
    {
      golongan: 'Kelompok IIC (Rumah Tangga Atas)',
      keterangan: 'Rumah tinggal mewah / daya listrik > 2200 VA',
      tarif: 'Rp 5.200 – Rp 9.500 / m³',
    },
    {
      golongan: 'Kelompok III (Niaga)',
      keterangan: 'Ruko, restoran, bengkel, perkantoran swasta, perhotelan',
      tarif: 'Rp 8.000 – Rp 14.500 / m³',
    },
    {
      golongan: 'Kelompok IV (Industri)',
      keterangan: 'Pabrik, manufaktur, industri tekstil, pencucian besar',
      tarif: 'Rp 11.000 – Rp 18.000 / m³',
    },
  ],
  ketentuan: [
    'Perhitungan tarif menggunakan sistem blok konsumsi progresif (Blok I: 0–10 m³, Blok II: 11–20 m³, Blok III: 21–30 m³, Blok IV: >30 m³).',
    'Total tagihan bulanan mencakup harga air, biaya pemeliharaan meter (bea beban), bea administrasi rekening, dan retribusi air limbah sesuai peraturan daerah.',
    'Tarif mengacu pada Keputusan Walikota Bandung tentang Penyesuaian Tarif Air Minum PERUMDA Tirtawening Kota Bandung.',
  ],
};

export function TarifAirView() {
  const router = useRouter();
  const [tarif, setTarif] = React.useState<StrukturTarifData>(DEFAULT_TARIF);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    let aktif = true;
    async function muatData() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data?.strukturTarif) {
          setTarif(json.data.strukturTarif);
        }
      } catch (err) {
        console.warn('[TARIF_AIR_VIEW] Gagal mengambil konfigurasi backend:', err);
      }
    }
    muatData();
    return () => {
      aktif = false;
    };
  }, []);

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
          kunci: 'struktur_tarif',
          nilai: tarif,
          kategori: 'cms',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan tarif air.');

      triggerToast(
        'Struktur Tarif Air Disimpan',
        'Tabel tarif golongan dan ketentuan perhitungan blok progresif berhasil diperbarui.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_TARIF_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Pengaturan Struktur Tarif Air"
          description="Konfigurasi tarif air per meter kubik (m³) untuk masing-masing golongan pelanggan dan ketentuan perhitungan sistem blok progresif."
          badge="Modul Mandiri Tarif Air"
          extraAction={
            <Button
              size="sm"
              onClick={handleSimpan}
              disabled={sedangMenyimpan}
              className="cursor-pointer gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Save className="size-3.5" />
              {sedangMenyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          }
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

        {/* 1. Informasi Golongan */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            Tabel Tarif Golongan Pelanggan
          </h2>

          <div className="space-y-3">
            {tarif.tarif.map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-border bg-background/50 space-y-2">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Golongan Pelanggan</label>
                    <Input
                      value={t.golongan}
                      onChange={(e) => {
                        const list = [...tarif.tarif];
                        list[idx] = { ...list[idx], golongan: e.target.value };
                        setTarif({ ...tarif, tarif: list });
                      }}
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Tarif Air per m³</label>
                    <Input
                      value={t.tarif}
                      onChange={(e) => {
                        const list = [...tarif.tarif];
                        list[idx] = { ...list[idx], tarif: e.target.value };
                        setTarif({ ...tarif, tarif: list });
                      }}
                      className="text-xs font-mono font-medium text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Keterangan / Sasaran</label>
                    <Input
                      value={t.keterangan}
                      onChange={(e) => {
                        const list = [...tarif.tarif];
                        list[idx] = { ...list[idx], keterangan: e.target.value };
                        setTarif({ ...tarif, tarif: list });
                      }}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Ketentuan Poin Tarif */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ketentuan & Kebijakan Penerapan Tarif</h3>
              <p className="text-xs text-muted-foreground">Poin regulasi teknis blok progresif dan biaya beban</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setTarif({
                  ...tarif,
                  ketentuan: [...tarif.ketentuan, 'Ketentuan baru penerapan tarif air'],
                })
              }
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" /> Tambah Ketentuan
            </Button>
          </div>

          <div className="space-y-2">
            {tarif.ketentuan.map((k, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">•</span>
                <Input
                  value={k}
                  onChange={(e) => {
                    const list = [...tarif.ketentuan];
                    list[idx] = e.target.value;
                    setTarif({ ...tarif, ketentuan: list });
                  }}
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setTarif({
                      ...tarif,
                      ketentuan: tarif.ketentuan.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer h-8 w-8"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
