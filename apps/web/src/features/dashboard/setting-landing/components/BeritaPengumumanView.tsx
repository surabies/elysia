// features/dashboard/setting-landing/components/BeritaPengumumanView.tsx
// Halaman Mandiri Pengaturan Berita, Rilis Informasi, & Pengumuman Publik

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Newspaper,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Tag,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type {
  BeritaPengumumanData,
  BeritaItem,
} from '@/types/pengaturan-konten';

const DEFAULT_BERITA: BeritaPengumumanData = {
  daftarBerita: [
    {
      slug: 'modernisasi-baca-meter',
      judul: 'Modernisasi Sistem Baca Meter Digital Kota Bandung',
      ringkasan: 'PERUMDA Tirtawening mempercepat transformasi digital pencatatan meter berbasis foto bukti fisik dan geofencing akurat untuk meningkatkan transparansi.',
      konten: 'Dalam rangka mewujudkan pelayanan air bersih yang akuntabel, PERUMDA Tirtawening meluncurkan sistem pembacaan meter digital terintegrasi. Petugas di lapangan kini dilengkapi aplikasi mobile dengan teknologi geofence.',
      tanggal: '18 November 2026',
      penulis: 'Humas Tirtawening',
      tag: 'Digitalisasi',
      aktif: true,
    },
    {
      slug: 'pemeliharaan-jaringan-dago',
      judul: 'Jadwal Pemeliharaan Pipa Distribusi Zona Bandung Utara',
      ringkasan: 'Pemberitahuan pekerjaan interkoneksi pipa transmisi di wilayah Dago dan Coblong guna meningkatkan tekanan aliran air ke pelanggan.',
      konten: 'Disampaikan kepada seluruh pelanggan terhormat di wilayah Bandung Utara, bahwa akan dilaksanakan pekerjaan optimalisasi jaringan distribusi utama pada akhir pekan ini. Pasokan air dialihkan secara bertahap.',
      tanggal: '15 November 2026',
      penulis: 'Divisi Transmisi & Distribusi',
      tag: 'Operasional',
      aktif: true,
    },
  ],
};

export function BeritaPengumumanView() {
  const router = useRouter();
  const [beritaData, setBeritaData] = React.useState<BeritaPengumumanData>(DEFAULT_BERITA);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    let aktif = true;
    async function muatData() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data?.beritaPengumuman) {
          setBeritaData(json.data.beritaPengumuman);
        }
      } catch (err) {
        console.warn('[BERITA_VIEW] Gagal mengambil konfigurasi berita:', err);
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

  const handleTambahBerita = () => {
    const baru: BeritaItem = {
      slug: `berita-${Date.now()}`,
      judul: 'Judul Publikasi / Pengumuman Baru',
      ringkasan: 'Ringkasan singkat berita yang akan muncul di beranda portal publik...',
      konten: 'Isi lengkap rilis kegiatan atau artikel pengumuman resmi...',
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      penulis: 'Humas Tirtawening',
      tag: 'Pengumuman',
      aktif: true,
    };
    setBeritaData({
      ...beritaData,
      daftarBerita: [baru, ...beritaData.daftarBerita],
    });
  };

  const handleUbahBerita = (index: number, key: keyof BeritaItem, val: any) => {
    const list = [...beritaData.daftarBerita];
    list[index] = { ...list[index], [key]: val };
    setBeritaData({ ...beritaData, daftarBerita: list });
  };

  const handleHapusBerita = (index: number) => {
    const list = beritaData.daftarBerita.filter((_, i) => i !== index);
    setBeritaData({ ...beritaData, daftarBerita: list });
  };

  const handleSimpan = async () => {
    setSedangMenyimpan(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kunci: 'berita_pengumuman',
          nilai: beritaData,
          kategori: 'cms',
        }),
      });

      if (!res.ok) throw new Error('Respon server gagal saat menyimpan berita.');

      triggerToast(
        'Berita & Pengumuman Disimpan',
        'Daftar publikasi artikel dan pengumuman resmi berhasil diperbarui di portal publik.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_BERITA_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Pengaturan Berita & Pengumuman Publik"
          description="Publikasikan rilis pers resmi, kegiatan perusahaan, artikel edukasi hemat air, serta pengumuman layanan bagi masyarakat."
          badge="Modul Mandiri Berita"
          extraAction={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleTambahBerita}
                className="cursor-pointer gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Tulis Berita Baru
              </Button>
              <Button
                size="sm"
                onClick={handleSimpan}
                disabled={sedangMenyimpan}
                className="cursor-pointer gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
              >
                <Save className="size-3.5" />
                {sedangMenyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
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

        {/* Daftar Berita */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Menampilkan total {beritaData.daftarBerita.length} artikel terdaftar</span>
            <span>Status aktif menentukan penayangan di halaman depan</span>
          </div>

          {beritaData.daftarBerita.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/50">
              <Newspaper className="size-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">Belum ada artikel berita</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Klik tombol di bawah untuk membuat publikasi pertama Anda.
              </p>
              <Button size="sm" onClick={handleTambahBerita} className="gap-1.5 text-xs cursor-pointer">
                <Plus className="size-3.5" /> Tulis Berita Pertama
              </Button>
            </div>
          ) : (
            beritaData.daftarBerita.map((item, idx) => (
              <div
                key={item.slug || idx}
                className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-border/80 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.aktif ? 'default' : 'secondary'} className="text-[11px]">
                      {item.aktif ? 'Tayang Publik' : 'Draf Disembunyikan'}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">slug: /{item.slug}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUbahBerita(idx, 'aktif', !item.aktif)}
                      className="cursor-pointer gap-1.5 text-xs h-7"
                    >
                      {item.aktif ? (
                        <>
                          <X className="size-3 text-amber-500" /> Sembunyikan
                        </>
                      ) : (
                        <>
                          <Check className="size-3 text-emerald-500" /> Publikasikan
                        </>
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleHapusBerita(idx)}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer h-7 w-7"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-foreground">Judul Artikel Berita</label>
                    <Input
                      value={item.judul}
                      onChange={(e) => handleUbahBerita(idx, 'judul', e.target.value)}
                      className="text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Tanggal Terbit
                    </label>
                    <Input
                      value={item.tanggal}
                      onChange={(e) => handleUbahBerita(idx, 'tanggal', e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <User className="size-3.5" /> Penulis / Divisi
                      </label>
                      <Input
                        value={item.penulis || ''}
                        onChange={(e) => handleUbahBerita(idx, 'penulis', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Tag className="size-3.5" /> Kategori Tag
                      </label>
                      <Input
                        value={item.tag || ''}
                        onChange={(e) => handleUbahBerita(idx, 'tag', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Ringkasan Berita (Tampil di Kartu Cuplikan)</label>
                    <Textarea
                      rows={2}
                      value={item.ringkasan}
                      onChange={(e) => handleUbahBerita(idx, 'ringkasan', e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Isi Lengkap Artikel Berita</label>
                    <Textarea
                      rows={4}
                      value={item.konten || ''}
                      onChange={(e) => handleUbahBerita(idx, 'konten', e.target.value)}
                      className="text-xs font-normal"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
