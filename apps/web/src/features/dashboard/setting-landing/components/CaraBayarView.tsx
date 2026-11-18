// features/dashboard/setting-landing/components/CaraBayarView.tsx
// Halaman Mandiri Pengaturan Alur & Kanal Pembayaran Tagihan Air (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CaraPembayaranData } from '@/types/pengaturan-konten';

const DEFAULT_CARA_BAYAR: CaraPembayaranData = {
  judul: 'Cara Pembayaran Tagihan Rekening Air',
  deskripsi: 'Langkah mudah membayar tagihan rekening air dan kanal perbankan/mitra resmi yang tersedia.',
  langkah: [
    {
      judul: 'Cek tagihan',
      isi: 'Masukkan nomor langganan 11 digit untuk melihat rincian jumlah tagihan rekening air berjalan.',
    },
    {
      judul: 'Pilih kanal pembayaran',
      isi: 'Pilih salah satu kanal pembayaran resmi yang tersedia (ATM, Mobile Banking, Dompet Digital, Minimarket, atau Loket Cabang).',
    },
    {
      judul: 'Simpan bukti bayar',
      isi: 'Simpan struk transaksi atau bukti transfer digital hingga status tagihan Anda berubah menjadi lunas.',
    },
  ],
  kanal: [
    {
      nama: 'Mobile Banking & ATM',
      deskripsi: 'Bank bjb, Bank Mandiri, BRI, BNI, BCA melalui menu Pembayaran Tagihan PDAM / Tirtawening Kota Bandung.',
    },
    {
      nama: 'Dompet Digital & E-Commerce',
      deskripsi: 'GoPay, OVO, DANA, ShopeePay, Tokopedia, dan Blibli dengan memasukkan 11 digit nomor langganan.',
    },
    {
      nama: 'Gerai Ritel Modern & Agen Resmi',
      deskripsi: 'Indomaret, Alfamart, Alfamidi, Pos Indonesia, dan Agen PPOB terverifikasi di seluruh Indonesia.',
    },
    {
      nama: 'Loket Kantor Pelayanan',
      deskripsi: 'Kantor Pusat Jl. Badaksinga No. 10 dan kantor cabang wilayah pelayanan Bandung (Senin - Jumat 08.00 - 15.00 WIB).',
    },
  ],
  catatanDenda:
    'Pembayaran tagihan rekening air jatuh tempo setiap tanggal 20 setiap bulannya. Keterlambatan dikenakan denda administrasi sesuai peraturan daerah yang berlaku.',
};

export function CaraBayarView() {
  const router = useRouter();
  const [caraBayar, setCaraBayar] = React.useState<CaraPembayaranData>(DEFAULT_CARA_BAYAR);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    let aktif = true;
    async function muatData() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data?.caraPembayaran) {
          setCaraBayar(json.data.caraPembayaran);
        }
      } catch (err) {
        console.warn('[CARA_BAYAR_VIEW] Gagal mengambil konfigurasi backend:', err);
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
          kunci: 'cara_pembayaran',
          nilai: caraBayar,
          kategori: 'cms',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan cara pembayaran.');

      triggerToast(
        'Cara Pembayaran Disimpan',
        'Data kanal pembayaran dan kebijakan jatuh tempo berhasil diperbarui.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_CARA_BAYAR_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Pengaturan Cara Pembayaran & Kanal Mitra"
          description="Konfigurasi panduan langkah pembayaran rekening air, daftar mitra perbankan/fintech, dan informasi batas jatuh tempo."
          badge="Modul Mandiri Cara Bayar"
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

        {/* 1. Judul & Info Denda */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            Judul & Kebijakan Batas Waktu
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Judul Halaman Pembayaran</label>
              <Input
                value={caraBayar.judul}
                onChange={(e) => setCaraBayar({ ...caraBayar, judul: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Catatan Jatuh Tempo & Denda Keterlambatan</label>
              <Input
                value={caraBayar.catatanDenda}
                onChange={(e) => setCaraBayar({ ...caraBayar, catatanDenda: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. Kanal Pembayaran Mitra */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daftar Kanal & Mitra Resmi</h3>
              <p className="text-xs text-muted-foreground">Pilihan bank, dompet digital, gerai ritel modern, dan loket resmi</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCaraBayar({
                  ...caraBayar,
                  kanal: [
                    ...caraBayar.kanal,
                    { nama: 'Kanal Pembayaran Baru', deskripsi: 'Deskripsi kanal dan instruksi pembayaran' },
                  ],
                })
              }
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" /> Tambah Kanal
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {caraBayar.kanal.map((k, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-border bg-background/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={k.nama}
                    onChange={(e) => {
                      const list = [...caraBayar.kanal];
                      list[idx] = { ...list[idx], nama: e.target.value };
                      setCaraBayar({ ...caraBayar, kanal: list });
                    }}
                    className="text-xs font-semibold"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setCaraBayar({
                        ...caraBayar,
                        kanal: caraBayar.kanal.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer h-8 w-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={k.deskripsi}
                  onChange={(e) => {
                    const list = [...caraBayar.kanal];
                    list[idx] = { ...list[idx], deskripsi: e.target.value };
                    setCaraBayar({ ...caraBayar, kanal: list });
                  }}
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
