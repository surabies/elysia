// apps/web/src/features/dashboard/pengaturan/components/TabPerusahaanProfil.tsx
// Modul Konsol Pengaturan Profil Perusahaan, Visi Misi, Alamat & Kantor Pelayanan

'use client';

import * as React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Compass,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProfilPerusahaanData,
  KontakLayananData,
  KantorCabangItem,
} from '@/types/pengaturan-konten';

interface Props {
  profil: ProfilPerusahaanData;
  kontak: KontakLayananData;
  onChangeProfil: (updated: ProfilPerusahaanData) => void;
  onChangeKontak: (updated: KontakLayananData) => void;
  onSimpanSemua: () => void;
  sedangMenyimpan?: boolean;
}

export function TabPerusahaanProfil({
  profil,
  kontak,
  onChangeProfil,
  onChangeKontak,
  onSimpanSemua,
  sedangMenyimpan = false,
}: Props) {
  // Tambah baris misi baru
  const handleTambahMisi = () => {
    onChangeProfil({
      ...profil,
      misi: [...profil.misi, ''],
    });
  };

  const handleUbahMisi = (index: number, val: string) => {
    const list = [...profil.misi];
    list[index] = val;
    onChangeProfil({
      ...profil,
      misi: list,
    });
  };

  const handleHapusMisi = (index: number) => {
    const list = profil.misi.filter((_, i) => i !== index);
    onChangeProfil({
      ...profil,
      misi: list,
    });
  };

  // Tambah kantor cabang baru
  const handleTambahCabang = () => {
    const baru: KantorCabangItem = {
      id: `cabang-${Date.now()}`,
      nama: 'Kantor Cabang Pelayanan Baru',
      wilayah: 'Wilayah Pelayanan',
      alamat: 'Jl. Alamat Kantor Layanan Baru',
      kontak: '(022) 2509030',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Cakupan kecamatan baru',
    };
    onChangeKontak({
      ...kontak,
      kantorCabang: [...kontak.kantorCabang, baru],
    });
  };

  const handleUbahCabang = (index: number, key: keyof KantorCabangItem, val: string) => {
    const list = [...kontak.kantorCabang];
    list[index] = { ...list[index], [key]: val };
    onChangeKontak({
      ...kontak,
      kantorCabang: list,
    });
  };

  const handleHapusCabang = (index: number) => {
    const list = kontak.kantorCabang.filter((_, i) => i !== index);
    onChangeKontak({
      ...kontak,
      kantorCabang: list,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Baris Info & Tombol Simpan Cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Konfigurasi Profil Perusahaan &amp; Jaringan Kantor
            </h2>
            <p className="text-xs text-muted-foreground">
              Data yang Anda atur di sini akan disinkronkan ke seluruh aplikasi, footer situs, dan halaman profil publik.
            </p>
          </div>
        </div>

        <Button
          onClick={onSimpanSemua}
          disabled={sedangMenyimpan}
          className="cursor-pointer gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium text-xs h-9"
        >
          <Save className="size-3.5" />
          <span>{sedangMenyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CARD 1: IDENTITAS & BRANDING PERUSAHAAN */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Building2 className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Identitas &amp; Legalitas Perusahaan</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block font-medium text-muted-foreground">
                Nama Lengkap Perusahaan
              </label>
              <Input
                value={profil.nama}
                onChange={(e) => onChangeProfil({ ...profil, nama: e.target.value })}
                className="text-xs"
                placeholder="Contoh: PERUMDA Tirtawening Kota Bandung"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  Nama Singkat / Brand
                </label>
                <Input
                  value={profil.singkatan}
                  onChange={(e) => onChangeProfil({ ...profil, singkatan: e.target.value })}
                  className="text-xs"
                  placeholder="Contoh: PERUMDA Tirtawening"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  Website Resmi
                </label>
                <Input
                  value={profil.website}
                  onChange={(e) => onChangeProfil({ ...profil, website: e.target.value })}
                  className="text-xs"
                  placeholder="https://tirtawening.co.id"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-medium text-muted-foreground">
                Slogan / Tagline
              </label>
              <Input
                value={profil.tagline}
                onChange={(e) => onChangeProfil({ ...profil, tagline: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-muted-foreground">
                Tentang Kami (Ringkasan BUMD)
              </label>
              <Textarea
                rows={3}
                value={profil.tentang}
                onChange={(e) => onChangeProfil({ ...profil, tentang: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-muted-foreground">
                Sejarah Singkat Perusahaan
              </label>
              <Textarea
                rows={3}
                value={profil.sejarah}
                onChange={(e) => onChangeProfil({ ...profil, sejarah: e.target.value })}
                className="text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: KONTAK PUSAT & JAM OPERASIONAL */}
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <Phone className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Kontak Kantor Pusat &amp; Layanan</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block font-medium text-muted-foreground">
                Alamat Kantor Pusat
              </label>
              <Textarea
                rows={2}
                value={profil.alamatPusat}
                onChange={(e) => {
                  onChangeProfil({ ...profil, alamatPusat: e.target.value });
                  onChangeKontak({
                    ...kontak,
                    kantorPusat: { ...kontak.kantorPusat, alamat: e.target.value },
                  });
                }}
                className="text-xs resize-none"
                placeholder="Jl. Badaksinga No. 10, Coblong, Kota Bandung 40132"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  Call Center / Pengaduan
                </label>
                <Input
                  value={profil.callCenter}
                  onChange={(e) => {
                    onChangeProfil({ ...profil, callCenter: e.target.value });
                    onChangeKontak({
                      ...kontak,
                      kantorPusat: { ...kontak.kantorPusat, callCenter: e.target.value },
                    });
                  }}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  WhatsApp Layanan
                </label>
                <Input
                  value={profil.whatsapp}
                  onChange={(e) => {
                    onChangeProfil({ ...profil, whatsapp: e.target.value });
                    onChangeKontak({
                      ...kontak,
                      kantorPusat: { ...kontak.kantorPusat, whatsapp: e.target.value },
                    });
                  }}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  Email Resmi
                </label>
                <Input
                  value={profil.email}
                  onChange={(e) => {
                    onChangeProfil({ ...profil, email: e.target.value });
                    onChangeKontak({
                      ...kontak,
                      kantorPusat: { ...kontak.kantorPusat, email: e.target.value },
                    });
                  }}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-muted-foreground">
                  Jam Layanan Loket
                </label>
                <Input
                  value={profil.jamLayanan}
                  onChange={(e) => {
                    onChangeProfil({ ...profil, jamLayanan: e.target.value });
                    onChangeKontak({
                      ...kontak,
                      kantorPusat: { ...kontak.kantorPusat, jamLayanan: e.target.value },
                    });
                  }}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-medium text-muted-foreground">
                Informasi Tanggap Darurat Kebocoran Pipa
              </label>
              <Textarea
                rows={2}
                value={kontak.daruratPipa}
                onChange={(e) => onChangeKontak({ ...kontak, daruratPipa: e.target.value })}
                className="text-xs resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: VISI & MISI PERUSAHAAN */}
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Visi &amp; Misi Perusahaan</h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTambahMisi}
            className="h-7 text-xs gap-1 cursor-pointer"
          >
            <Plus className="size-3" /> Tambah Poin Misi
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-muted-foreground">
              Pernyataan Visi Perusahaan
            </label>
            <Textarea
              rows={2}
              value={profil.visi}
              onChange={(e) => onChangeProfil({ ...profil, visi: e.target.value })}
              className="text-xs resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-medium text-muted-foreground">
              Daftar Misi Perusahaan:
            </label>
            <div className="space-y-2">
              {profil.misi.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Input
                    value={m}
                    onChange={(e) => handleUbahMisi(idx, e.target.value)}
                    className="h-8 text-xs flex-1"
                    placeholder={`Poin misi ke-${idx + 1}...`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleHapusMisi(idx)}
                    className="size-7 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 cursor-pointer"
                    title="Hapus Misi"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CARD 4: JARINGAN KANTOR CABANG & PELAYANAN WILAYAH */}
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Jaringan Kantor Cabang &amp; Pelayanan Wilayah ({kontak.kantorCabang.length} Wilayah)
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleTambahCabang}
            className="h-7 text-xs gap-1 cursor-pointer"
          >
            <Plus className="size-3" /> Tambah Kantor Wilayah
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {kontak.kantorCabang.map((cabang, idx) => (
            <div
              key={cabang.id || idx}
              className="rounded-xl border bg-muted/20 p-4 space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {cabang.wilayah || `Wilayah ${idx + 1}`}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleHapusCabang(idx)}
                  className="size-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                  title="Hapus Cabang"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Nama Kantor
                  </label>
                  <Input
                    value={cabang.nama}
                    onChange={(e) => handleUbahCabang(idx, 'nama', e.target.value)}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Alamat Lengkap
                  </label>
                  <Input
                    value={cabang.alamat}
                    onChange={(e) => handleUbahCabang(idx, 'alamat', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Nomor Telepon
                    </label>
                    <Input
                      value={cabang.kontak}
                      onChange={(e) => handleUbahCabang(idx, 'kontak', e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground uppercase">
                      Wilayah / Label
                    </label>
                    <Input
                      value={cabang.wilayah}
                      onChange={(e) => handleUbahCabang(idx, 'wilayah', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">
                    Cakupan Wilayah / Keterangan
                  </label>
                  <Input
                    value={cabang.keterangan || ''}
                    onChange={(e) => handleUbahCabang(idx, 'keterangan', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Contoh: Kec. Rancasari, Gedebage, Buahbatu"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
