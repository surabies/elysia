// apps/web/src/features/dashboard/pengaturan/components/TabKontenPublikCms.tsx
// Modul Konsol CMS Konten Layanan Publik: Pasang Baru, Cara Bayar, Tarif Air, Berita & Info Gangguan

'use client';

import * as React from 'react';
import {
  FileText,
  CreditCard,
  DollarSign,
  Newspaper,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  SyaratPasangBaruData,
  CaraPembayaranData,
  StrukturTarifData,
  BeritaPengumumanData,
  InfoGangguanAirData,
  AlurPasangItem,
  LangkahBayarItem,
  KanalBayarItem,
  TarifGolonganItem,
  BeritaItem,
  GangguanAirItem,
} from '@/types/pengaturan-konten';

interface Props {
  syarat: SyaratPasangBaruData;
  caraBayar: CaraPembayaranData;
  tarif: StrukturTarifData;
  berita: BeritaPengumumanData;
  gangguan: InfoGangguanAirData;
  onChangeSyarat: (data: SyaratPasangBaruData) => void;
  onChangeCaraBayar: (data: CaraPembayaranData) => void;
  onChangeTarif: (data: StrukturTarifData) => void;
  onChangeBerita: (data: BeritaPengumumanData) => void;
  onChangeGangguan: (data: InfoGangguanAirData) => void;
  onSimpanSemua: () => void;
  sedangMenyimpan?: boolean;
}

type SubModul = 'pasang-baru' | 'cara-bayar' | 'tarif-air' | 'berita' | 'info-gangguan';

export function TabKontenPublikCms({
  syarat,
  caraBayar,
  tarif,
  berita,
  gangguan,
  onChangeSyarat,
  onChangeCaraBayar,
  onChangeTarif,
  onChangeBerita,
  onChangeGangguan,
  onSimpanSemua,
  sedangMenyimpan = false,
}: Props) {
  const [subModul, setSubModul] = React.useState<SubModul>('pasang-baru');

  // --- Handlers Syarat Pasang Baru ---
  const handleTambahDokumen = () => {
    onChangeSyarat({
      ...syarat,
      syaratDokumen: [...syarat.syaratDokumen, 'Dokumen persyaratan baru'],
    });
  };

  const handleUbahDokumen = (idx: number, val: string) => {
    const list = [...syarat.syaratDokumen];
    list[idx] = val;
    onChangeSyarat({ ...syarat, syaratDokumen: list });
  };

  const handleHapusDokumen = (idx: number) => {
    onChangeSyarat({
      ...syarat,
      syaratDokumen: syarat.syaratDokumen.filter((_, i) => i !== idx),
    });
  };

  const handleTambahAlurPasang = () => {
    onChangeSyarat({
      ...syarat,
      alurTahapan: [
        ...syarat.alurTahapan,
        { judul: `${syarat.alurTahapan.length + 1}. Tahapan Baru`, isi: 'Deskripsi tahapan' },
      ],
    });
  };

  // --- Handlers Cara Pembayaran ---
  const handleTambahKanal = () => {
    onChangeCaraBayar({
      ...caraBayar,
      kanal: [
        ...caraBayar.kanal,
        { nama: 'Kanal Pembayaran Baru', deskripsi: 'Deskripsi mitra & cara bayar' },
      ],
    });
  };

  // --- Handlers Tarif Air ---
  const handleTambahTarif = () => {
    onChangeTarif({
      ...tarif,
      tarif: [
        ...tarif.tarif,
        { golongan: 'Kelompok Baru', keterangan: 'Kriteria pelanggan', tarif: 'Rp 0 / m³' },
      ],
    });
  };

  // --- Handlers Berita ---
  const handleTambahBerita = () => {
    const baru: BeritaItem = {
      slug: `pengumuman-${Date.now()}`,
      judul: 'Judul Pengumuman Resmi Baru',
      ringkasan: 'Ringkasan singkat pengumuman yang akan tampil di beranda dan halaman berita.',
      tanggal: new Date().toISOString().split('T')[0],
      penulis: 'Humas PERUMDA Tirtawening',
      tag: 'Pengumuman',
      aktif: true,
    };
    onChangeBerita({
      ...berita,
      daftarBerita: [baru, ...berita.daftarBerita],
    });
  };

  // --- Handlers Info Gangguan ---
  const handleTambahGangguan = () => {
    const baru: GangguanAirItem = {
      id: `g-${Date.now()}`,
      wilayah: 'Wilayah Terdampak (Kecamatan / Kelurahan)',
      penyebab: 'Penyebab gangguan aliran (contoh: pipa bocor / pemeliharaan berkala)',
      status: 'Sedang ditangani',
      perkiraan: 'Hari ini pukul 18.00 WIB',
      tanggal: new Date().toISOString().split('T')[0],
    };
    onChangeGangguan({
      ...gangguan,
      daftarGangguan: [baru, ...gangguan.daftarGangguan],
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header CMS & Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Manajemen Konten Publik &amp; Kebijakan Layanan (CMS)
            </h2>
            <p className="text-xs text-muted-foreground">
              Perubahan di sini langsung terbit secara dinamis pada portal pelanggan publik, syarat pemasangan, panduan bayar, berita, dan gangguan.
            </p>
          </div>
        </div>

        <Button
          onClick={onSimpanSemua}
          disabled={sedangMenyimpan}
          className="cursor-pointer gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium text-xs h-9"
        >
          <Save className="size-3.5" />
          <span>{sedangMenyimpan ? 'Menyimpan...' : 'Simpan Semua Konten'}</span>
        </Button>
      </div>

      {/* 2. Sub-tab Navigasi Konten */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <button
          onClick={() => setSubModul('pasang-baru')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            subModul === 'pasang-baru'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <FileText className="size-3.5" />
          <span>Syarat Pasang Baru</span>
        </button>

        <button
          onClick={() => setSubModul('cara-bayar')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            subModul === 'cara-bayar'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <CreditCard className="size-3.5" />
          <span>Tata Cara Pembayaran</span>
        </button>

        <button
          onClick={() => setSubModul('tarif-air')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            subModul === 'tarif-air'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <DollarSign className="size-3.5" />
          <span>Struktur Tarif Air</span>
        </button>

        <button
          onClick={() => setSubModul('berita')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            subModul === 'berita'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Newspaper className="size-3.5" />
          <span>Berita &amp; Pengumuman</span>
        </button>

        <button
          onClick={() => setSubModul('info-gangguan')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
            subModul === 'info-gangguan'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <AlertTriangle className="size-3.5" />
          <span>Info Gangguan Air</span>
        </button>
      </div>

      {/* 3. ISI SUBMODUL 1: SYARAT PASANG BARU */}
      {subModul === 'pasang-baru' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Konten Halaman Pasang Baru Sambungan Air Minum
              </h3>
              <p className="text-xs text-muted-foreground">
                Tampil di halaman rute <code className="font-mono text-primary">/pasang-baru</code>
              </p>
            </div>
            <a
              href="/pasang-baru"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Pratinjau Halaman Publik <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Persyaratan Dokumen */}
            <div className="space-y-4 rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Daftar Persyaratan Dokumen ({syarat.syaratDokumen.length})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTambahDokumen}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <Plus className="size-3" /> Tambah Syarat
                </Button>
              </div>

              <div className="space-y-2">
                {syarat.syaratDokumen.map((dok, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <Input
                      value={dok}
                      onChange={(e) => handleUbahDokumen(idx, e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleHapusDokumen(idx)}
                      className="size-7 text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Catatan Penting / Ketentuan Jarak Pipa Retikulasi:
                </label>
                <Textarea
                  rows={3}
                  value={syarat.catatanPenting}
                  onChange={(e) => onChangeSyarat({ ...syarat, catatanPenting: e.target.value })}
                  className="mt-1 text-xs resize-none"
                />
              </div>
            </div>

            {/* Alur Tahapan Pemasangan */}
            <div className="space-y-4 rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Alur Tahapan Pemasangan ({syarat.alurTahapan.length})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTambahAlurPasang}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <Plus className="size-3" /> Tambah Tahap
                </Button>
              </div>

              <div className="space-y-3">
                {syarat.alurTahapan.map((alur, idx) => (
                  <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        value={alur.judul}
                        onChange={(e) => {
                          const list = [...syarat.alurTahapan];
                          list[idx] = { ...list[idx], judul: e.target.value };
                          onChangeSyarat({ ...syarat, alurTahapan: list });
                        }}
                        className="h-7 text-xs font-semibold"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const list = syarat.alurTahapan.filter((_, i) => i !== idx);
                          onChangeSyarat({ ...syarat, alurTahapan: list });
                        }}
                        className="size-7 text-red-500 hover:bg-red-50 cursor-pointer shrink-0 ml-2"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={alur.isi}
                      onChange={(e) => {
                        const list = [...syarat.alurTahapan];
                        list[idx] = { ...list[idx], isi: e.target.value };
                        onChangeSyarat({ ...syarat, alurTahapan: list });
                      }}
                      className="text-xs resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ISI SUBMODUL 2: CARA PEMBAYARAN */}
      {subModul === 'cara-bayar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Konten Tata Cara &amp; Kanal Pembayaran Tagihan Air
              </h3>
              <p className="text-xs text-muted-foreground">
                Tampil di halaman rute <code className="font-mono text-primary">/cara-pembayaran</code>
              </p>
            </div>
            <a
              href="/cara-pembayaran"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Pratinjau Halaman Publik <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Langkah Pembayaran */}
            <div className="space-y-4 rounded-xl border bg-card p-5">
              <h4 className="border-b pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Langkah Pembayaran Pelanggan
              </h4>
              <div className="space-y-3">
                {caraBayar.langkah.map((l, idx) => (
                  <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                    <Input
                      value={l.judul}
                      onChange={(e) => {
                        const list = [...caraBayar.langkah];
                        list[idx] = { ...list[idx], judul: e.target.value };
                        onChangeCaraBayar({ ...caraBayar, langkah: list });
                      }}
                      className="h-7 text-xs font-semibold"
                    />
                    <Textarea
                      rows={2}
                      value={l.isi}
                      onChange={(e) => {
                        const list = [...caraBayar.langkah];
                        list[idx] = { ...list[idx], isi: e.target.value };
                        onChangeCaraBayar({ ...caraBayar, langkah: list });
                      }}
                      className="text-xs resize-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Kebijakan Batas Waktu Jatuh Tempo &amp; Denda:
                </label>
                <Textarea
                  rows={2}
                  value={caraBayar.catatanDenda}
                  onChange={(e) => onChangeCaraBayar({ ...caraBayar, catatanDenda: e.target.value })}
                  className="mt-1 text-xs resize-none"
                />
              </div>
            </div>

            {/* Kanal Pembayaran Mitra Resmi */}
            <div className="space-y-4 rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Kanal Pembayaran &amp; Mitra ({caraBayar.kanal.length})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTambahKanal}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <Plus className="size-3" /> Tambah Kanal
                </Button>
              </div>

              <div className="space-y-3">
                {caraBayar.kanal.map((k, idx) => (
                  <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Input
                        value={k.nama}
                        onChange={(e) => {
                          const list = [...caraBayar.kanal];
                          list[idx] = { ...list[idx], nama: e.target.value };
                          onChangeCaraBayar({ ...caraBayar, kanal: list });
                        }}
                        className="h-7 text-xs font-semibold"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const list = caraBayar.kanal.filter((_, i) => i !== idx);
                          onChangeCaraBayar({ ...caraBayar, kanal: list });
                        }}
                        className="size-7 text-red-500 hover:bg-red-50 cursor-pointer shrink-0 ml-2"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={k.deskripsi}
                      onChange={(e) => {
                        const list = [...caraBayar.kanal];
                        list[idx] = { ...list[idx], deskripsi: e.target.value };
                        onChangeCaraBayar({ ...caraBayar, kanal: list });
                      }}
                      className="text-xs resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ISI SUBMODUL 3: STRUKTUR TARIF AIR */}
      {subModul === 'tarif-air' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Tabel Struktur Tarif &amp; Blok Konsumsi Progresif
              </h3>
              <p className="text-xs text-muted-foreground">
                Tampil di halaman rute <code className="font-mono text-primary">/tarif-air</code>
              </p>
            </div>
            <a
              href="/tarif-air"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Pratinjau Halaman Publik <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Daftar Golongan Pelanggan &amp; Rentang Tarif ({tarif.tarif.length} Golongan)
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTambahTarif}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Tambah Golongan
              </Button>
            </div>

            <div className="space-y-3">
              {tarif.tarif.map((t, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/20 p-3 sm:grid-cols-12 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Golongan Pelanggan
                    </label>
                    <Input
                      value={t.golongan}
                      onChange={(e) => {
                        const list = [...tarif.tarif];
                        list[idx] = { ...list[idx], golongan: e.target.value };
                        onChangeTarif({ ...tarif, tarif: list });
                      }}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Kriteria Sambungan
                    </label>
                    <Input
                      value={t.keterangan}
                      onChange={(e) => {
                        const list = [...tarif.tarif];
                        list[idx] = { ...list[idx], keterangan: e.target.value };
                        onChangeTarif({ ...tarif, tarif: list });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Tarif Progresif
                    </label>
                    <Input
                      value={t.tarif}
                      onChange={(e) => {
                        const list = [...tarif.tarif];
                        list[idx] = { ...list[idx], tarif: e.target.value };
                        onChangeTarif({ ...tarif, tarif: list });
                      }}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const list = tarif.tarif.filter((_, i) => i !== idx);
                        onChangeTarif({ ...tarif, tarif: list });
                      }}
                      className="size-8 text-red-500 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ketentuan Perhitungan */}
            <div className="pt-4 border-t space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Ketentuan &amp; Peraturan Tarif:
              </label>
              {tarif.ketentuan.map((k, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={k}
                    onChange={(e) => {
                      const list = [...tarif.ketentuan];
                      list[idx] = e.target.value;
                      onChangeTarif({ ...tarif, ketentuan: list });
                    }}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const list = tarif.ketentuan.filter((_, i) => i !== idx);
                      onChangeTarif({ ...tarif, ketentuan: list });
                    }}
                    className="size-7 text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onChangeTarif({
                    ...tarif,
                    ketentuan: [...tarif.ketentuan, 'Ketentuan baru perhitungan tarif'],
                  })
                }
                className="h-7 text-xs gap-1 cursor-pointer mt-1"
              >
                <Plus className="size-3" /> Tambah Ketentuan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ISI SUBMODUL 4: BERITA & PENGUMUMAN */}
      {subModul === 'berita' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Kelola Berita, Siaran Pers, &amp; Pengumuman Resmi
              </h3>
              <p className="text-xs text-muted-foreground">
                Tampil di halaman rute <code className="font-mono text-primary">/berita</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/berita"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Pratinjau Halaman <ExternalLink className="size-3" />
              </a>
              <Button
                size="sm"
                onClick={handleTambahBerita}
                className="h-8 text-xs gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="size-3.5" /> Tambah Berita Baru
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {berita.daftarBerita.map((b, idx) => (
              <div
                key={b.slug || idx}
                className="rounded-xl border bg-card p-5 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {b.tag || 'Pengumuman'}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {b.tanggal}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const list = berita.daftarBerita.filter((_, i) => i !== idx);
                      onChangeBerita({ ...berita, daftarBerita: list });
                    }}
                    className="size-7 text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Judul Berita
                    </label>
                    <Input
                      value={b.judul}
                      onChange={(e) => {
                        const list = [...berita.daftarBerita];
                        list[idx] = { ...list[idx], judul: e.target.value };
                        onChangeBerita({ ...berita, daftarBerita: list });
                      }}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground uppercase">
                        Tanggal Terbit
                      </label>
                      <Input
                        type="date"
                        value={b.tanggal}
                        onChange={(e) => {
                          const list = [...berita.daftarBerita];
                          list[idx] = { ...list[idx], tanggal: e.target.value };
                          onChangeBerita({ ...berita, daftarBerita: list });
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground uppercase">
                        Kategori / Tag
                      </label>
                      <Input
                        value={b.tag || ''}
                        onChange={(e) => {
                          const list = [...berita.daftarBerita];
                          list[idx] = { ...list[idx], tag: e.target.value };
                          onChangeBerita({ ...berita, daftarBerita: list });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Ringkasan Berita (Tampil di kartu publik)
                  </label>
                  <Textarea
                    rows={2}
                    value={b.ringkasan}
                    onChange={(e) => {
                      const list = [...berita.daftarBerita];
                      list[idx] = { ...list[idx], ringkasan: e.target.value };
                      onChangeBerita({ ...berita, daftarBerita: list });
                    }}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ISI SUBMODUL 5: INFO GANGGUAN AIR */}
      {subModul === 'info-gangguan' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Informasi Pekerjaan Pipa &amp; Gangguan Aliran Air Bersih
              </h3>
              <p className="text-xs text-muted-foreground">
                Tampil di halaman rute <code className="font-mono text-primary">/info-gangguan</code>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/info-gangguan"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Pratinjau Halaman <ExternalLink className="size-3" />
              </a>
              <Button
                size="sm"
                onClick={handleTambahGangguan}
                className="h-8 text-xs gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="size-3.5" /> Tambah Info Gangguan
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {gangguan.daftarGangguan.map((g, idx) => (
              <div
                key={g.id || idx}
                className="rounded-xl border bg-card p-5 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-semibold border',
                        g.status === 'Selesai'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      )}
                    >
                      {g.status}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      ID: {g.id}
                    </span>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const list = gangguan.daftarGangguan.filter((_, i) => i !== idx);
                      onChangeGangguan({ ...gangguan, daftarGangguan: list });
                    }}
                    className="size-7 text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Wilayah Terdampak
                    </label>
                    <Input
                      value={g.wilayah}
                      onChange={(e) => {
                        const list = [...gangguan.daftarGangguan];
                        list[idx] = { ...list[idx], wilayah: e.target.value };
                        onChangeGangguan({ ...gangguan, daftarGangguan: list });
                      }}
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground uppercase">
                        Status Penanganan
                      </label>
                      <select
                        value={g.status}
                        onChange={(e) => {
                          const list = [...gangguan.daftarGangguan];
                          list[idx] = {
                            ...list[idx],
                            status: e.target.value as GangguanAirItem['status'],
                          };
                          onChangeGangguan({ ...gangguan, daftarGangguan: list });
                        }}
                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="Sedang ditangani">Sedang ditangani</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Investigasi Lapangan">Investigasi Lapangan</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground uppercase">
                        Estimasi Pemulihan
                      </label>
                      <Input
                        value={g.perkiraan}
                        onChange={(e) => {
                          const list = [...gangguan.daftarGangguan];
                          list[idx] = { ...list[idx], perkiraan: e.target.value };
                          onChangeGangguan({ ...gangguan, daftarGangguan: list });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Penyebab Gangguan Teknis
                  </label>
                  <Textarea
                    rows={2}
                    value={g.penyebab}
                    onChange={(e) => {
                      const list = [...gangguan.daftarGangguan];
                      list[idx] = { ...list[idx], penyebab: e.target.value };
                      onChangeGangguan({ ...gangguan, daftarGangguan: list });
                    }}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
