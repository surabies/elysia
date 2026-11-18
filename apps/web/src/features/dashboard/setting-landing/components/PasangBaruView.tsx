// features/dashboard/setting-landing/components/PasangBaruView.tsx
// Halaman Mandiri Pengaturan Syarat Pasang Baru Sambungan Air (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SyaratPasangBaruData } from '@/types/pengaturan-konten';

const DEFAULT_SYARAT: SyaratPasangBaruData = {
  judul: 'Pasang Baru Sambungan Air Minum',
  deskripsi: 'Syarat dan alur pengajuan sambungan air minum perpipaan baru PERUMDA Tirtawening Kota Bandung.',
  syaratDokumen: [
    'Fotokopi KTP / identitas diri pemohon yang masih berlaku',
    'Fotokopi bukti kepemilikan bangunan (Sertifikat Tanah / AJB / IMB / PBB terakhir)',
    'Surat kuasa bermaterai apabila pemohon bukan pemilik sah bangunan',
    'Denah lokasi atau titik koordinat bangunan yang akan dipasangi sambungan',
    'Mengisi formulir Surat Permohonan Langganan (SPL) air minum resmi',
  ],
  alurTahapan: [
    {
      judul: '1. Pengajuan Permohonan',
      isi: 'Datangi loket kantor pelayanan wilayah terdekat atau hubungi petugas layanan untuk mengisi formulir pendaftaran sambungan baru.',
    },
    {
      judul: '2. Survei Teknis & Gambar Rencana',
      isi: 'Petugas teknis melakukan survei ke lokasi guna memeriksa jaringan pipa distribusi terdekat dan menyusun rencana anggaran biaya (RAB).',
    },
    {
      judul: '3. Pembayaran Biaya Sambungan',
      isi: 'Pemohon melakukan pembayaran biaya pasang baru resmi sesuai rincian RAB di loket atau kanal perbankan mitra.',
    },
    {
      judul: '4. Pemasangan & Kalibrasi Meter',
      isi: 'Teknisi memasang pipa dinas, kran meter, dan water meter air tersegel, disusul penerbitan 11 digit Nomor Langganan resmi.',
    },
  ],
  catatanPenting:
    'Biaya pemasangan sambungan standar mengacu pada jarak pipa retikulasi ke kran meter maksimal 6 meter. Kelebihan jarak pipa dikenakan biaya tambahan sesuai tarif teknis resmi.',
};

export function PasangBaruView() {
  const router = useRouter();
  const [syarat, setSyarat] = React.useState<SyaratPasangBaruData>(DEFAULT_SYARAT);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    let aktif = true;
    async function muatData() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data?.syaratPasangBaru) {
          setSyarat(json.data.syaratPasangBaru);
        }
      } catch (err) {
        console.warn('[PASANG_BARU_VIEW] Gagal mengambil konfigurasi backend:', err);
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
          kunci: 'syarat_pasang_baru',
          nilai: syarat,
          kategori: 'cms',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan syarat pasang baru.');

      triggerToast(
        'Syarat Pasang Baru Disimpan',
        'Persyaratan dokumen dan alur pengajuan pasang baru berhasil diperbarui.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_SYARAT_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Pengaturan Syarat Pasang Baru"
          description="Konfigurasi dokumen persyaratan wajib, tahapan survei lapangan & pemasangan, serta ketentuan teknis sambungan meter air baru."
          badge="Modul Mandiri Pasang Baru"
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

        {/* 1. Judul & Deskripsi */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Judul & Informasi Umum
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Judul Halaman Pasang Baru</label>
              <Input
                value={syarat.judul}
                onChange={(e) => setSyarat({ ...syarat, judul: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Deskripsi Pengantar</label>
              <Input
                value={syarat.deskripsi}
                onChange={(e) => setSyarat({ ...syarat, deskripsi: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. Dokumen Persyaratan */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daftar Dokumen Persyaratan</h3>
              <p className="text-xs text-muted-foreground">Dokumen wajib yang harus disiapkan pelanggan</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSyarat({
                  ...syarat,
                  syaratDokumen: [...syarat.syaratDokumen, 'Dokumen persyaratan baru'],
                })
              }
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" /> Tambah Dokumen
            </Button>
          </div>

          <div className="space-y-2">
            {syarat.syaratDokumen.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">{idx + 1}.</span>
                <Input
                  value={item}
                  onChange={(e) => {
                    const list = [...syarat.syaratDokumen];
                    list[idx] = e.target.value;
                    setSyarat({ ...syarat, syaratDokumen: list });
                  }}
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setSyarat({
                      ...syarat,
                      syaratDokumen: syarat.syaratDokumen.filter((_, i) => i !== idx),
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

        {/* 3. Alur Tahapan */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Alur & Tahapan Pengajuan</h3>
              <p className="text-xs text-muted-foreground">Langkah prosedural dari permohonan hingga air mengalir</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSyarat({
                  ...syarat,
                  alurTahapan: [
                    ...syarat.alurTahapan,
                    { judul: `${syarat.alurTahapan.length + 1}. Tahapan Baru`, isi: 'Deskripsi tahapan baru' },
                  ],
                })
              }
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" /> Tambah Alur
            </Button>
          </div>

          <div className="space-y-3">
            {syarat.alurTahapan.map((alur, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-border/80 bg-background/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={alur.judul}
                    onChange={(e) => {
                      const list = [...syarat.alurTahapan];
                      list[idx] = { ...list[idx], judul: e.target.value };
                      setSyarat({ ...syarat, alurTahapan: list });
                    }}
                    className="text-xs font-semibold"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setSyarat({
                        ...syarat,
                        alurTahapan: syarat.alurTahapan.filter((_, i) => i !== idx),
                      })
                    }
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer h-8 w-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={alur.isi}
                  onChange={(e) => {
                    const list = [...syarat.alurTahapan];
                    list[idx] = { ...list[idx], isi: e.target.value };
                    setSyarat({ ...syarat, alurTahapan: list });
                  }}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <label className="text-xs font-medium text-foreground">Catatan Penting RAB & Ketentuan Jarak</label>
            <Textarea
              rows={2}
              value={syarat.catatanPenting}
              onChange={(e) => setSyarat({ ...syarat, catatanPenting: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
