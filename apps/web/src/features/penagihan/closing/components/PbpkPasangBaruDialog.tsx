'use client';

import * as React from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Layers,
  Search,
  UserPlus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  fetchPelangganUntukPk,
  type PelangganPkPreview,
} from '../lib/closing-api';
import { computeNextPeriode, formatPeriodeLabelId } from '../lib/closing-format';
import type {
  CreatePasangBaruPayload,
  CreatePerubahanKategoriPayload,
  MasterOptionItem,
  PasangBaruItem,
} from '../types';
import { cn } from '@/lib/utils';

export interface PbpkPasangBaruDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodeAktif: string;
  initialItem?: PasangBaruItem | null;
  masterTarif: MasterOptionItem[];
  masterRute: MasterOptionItem[];
  actionLoading: boolean;
  onSubmit: (payload: CreatePasangBaruPayload) => Promise<boolean>;
  onSubmitPerubahanKategori?: (
    payload: CreatePerubahanKategoriPayload,
  ) => Promise<boolean>;
}

export function PbpkPasangBaruDialog({
  open,
  onOpenChange,
  periodeAktif,
  initialItem,
  masterTarif,
  masterRute,
  actionLoading,
  onSubmit,
  onSubmitPerubahanKategori,
}: PbpkPasangBaruDialogProps) {
  const nextPeriode = computeNextPeriode(periodeAktif);
  const isEditingExisting = Boolean(initialItem);

  // Tab mode pemilihan tipe mutasi: PB vs PK
  const [tipeMutasi, setTipeMutasi] = React.useState<'PB' | 'PK'>('PB');

  // Common: Target Periode DPM
  const [targetPeriode, setTargetPeriode] = React.useState(periodeAktif);

  // Form state: Pasang Baru (PB)
  const [nolg, setNolg] = React.useState('');
  const [nama, setNama] = React.useState('');
  const [alamat, setAlamat] = React.useState('');
  const [tarifKode, setTarifKode] = React.useState('2A2');
  const [ruteKode, setRuteKode] = React.useState('CD104');
  const [noMeter, setNoMeter] = React.useState('');
  const [noTelp, setNoTelp] = React.useState('');

  // Form state: Pemasangan Kembali (PK)
  const [pkNolg, setPkNolg] = React.useState('');
  const [pkFoundPelanggan, setPkFoundPelanggan] =
    React.useState<PelangganPkPreview | null>(null);
  const [pkSearching, setPkSearching] = React.useState(false);
  const [pkSearchError, setPkSearchError] = React.useState<string | null>(null);
  const [pkTarifBaru, setPkTarifBaru] = React.useState('2A2');
  const [pkNoMeterBaru, setPkNoMeterBaru] = React.useState('');
  const [pkNomorSk, setPkNomorSk] = React.useState('');
  const [pkAlasan, setPkAlasan] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    if (initialItem) {
      setTipeMutasi(initialItem.mutasian === 'PK' ? 'PK' : 'PB');
      setTargetPeriode(periodeAktif);
      setNolg(initialItem.nolg);
      setNama(initialItem.nama);
      setAlamat(
        initialItem.alamat === 'Alamat Terdata LapDataMeter'
          ? ''
          : initialItem.alamat,
      );
      setTarifKode(initialItem.tarifKode || '2A2');
      setRuteKode(initialItem.ruteKode || masterRute[0]?.kode || 'CD104');
      setNoMeter(initialItem.noMeter || '');
      setNoTelp(initialItem.noTelp || '');

      setPkNolg(initialItem.nolg);
      setPkTarifBaru(initialItem.tarifKode || '2A2');
      setPkNoMeterBaru(initialItem.noMeter || '');
      setPkFoundPelanggan(null);
      setPkSearchError(null);
    } else {
      setTipeMutasi('PB');
      setTargetPeriode(periodeAktif);
      setNolg('');
      setNama('');
      setAlamat('');
      setTarifKode(masterTarif[0]?.kode || '2A2');
      setRuteKode(masterRute[0]?.kode || 'CD104');
      setNoMeter('');
      setNoTelp('');

      setPkNolg('');
      setPkFoundPelanggan(null);
      setPkSearchError(null);
      setPkTarifBaru(masterTarif[0]?.kode || '2A2');
      setPkNoMeterBaru('');
      setPkNomorSk('');
      setPkAlasan('');
    }
  }, [open, initialItem, periodeAktif, masterRute, masterTarif]);

  // Handler auto-fetch pelanggan lama untuk PK
  const handleCariPelangganPk = async (targetNolgToSearch?: string) => {
    const raw = (targetNolgToSearch ?? pkNolg).trim();
    if (!raw) {
      setPkSearchError('Masukkan Nomor Langganan (NOLG) terlebih dahulu.');
      return;
    }
    setPkSearching(true);
    setPkSearchError(null);
    try {
      const data = await fetchPelangganUntukPk(raw);
      setPkFoundPelanggan(data);
      if (data.tarifKode) {
        setPkTarifBaru(data.tarifKode);
      }
    } catch (err: any) {
      setPkFoundPelanggan(null);
      setPkSearchError(
        err.message || `Pelanggan dengan NOLG ${raw} tidak ditemukan dalam database.`,
      );
    } finally {
      setPkSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tipeMutasi === 'PB') {
      const ok = await onSubmit({
        nolg: nolg.trim(),
        nama: nama.trim(),
        alamat: alamat.trim(),
        tarifKode,
        ruteKode,
        noMeter: noMeter.trim(),
        noTelp: noTelp.trim() || undefined,
        periode: targetPeriode,
      });
      if (ok) {
        onOpenChange(false);
      }
    } else {
      if (!onSubmitPerubahanKategori) return;
      if (!pkFoundPelanggan && !isEditingExisting) {
        setPkSearchError(
          'Harap cari dan pastikan data pelanggan lama terverifikasi sebelum menyimpan PK.',
        );
        return;
      }
      const ok = await onSubmitPerubahanKategori({
        nolg: pkNolg.trim(),
        tarifKodeBaru: pkTarifBaru,
        noMeterBaru: pkNoMeterBaru.trim() || undefined,
        periode: targetPeriode,
        nomorSk: pkNomorSk.trim() || undefined,
        alasan: pkAlasan.trim() || undefined,
      });
      if (ok) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] p-6 gap-5">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground">
              {tipeMutasi === 'PB' ? (
                <UserPlus className="size-4" />
              ) : (
                <Layers className="size-4" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditingExisting
                  ? `Edit Atribut Sambungan (${initialItem?.nolg})`
                  : 'Pendaftaran Mutasi PBPK'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isEditingExisting
                  ? 'Perbarui nomor seri water meter, alamat terdaftar, atau tarif pelanggan pada DPM terpilih.'
                  : 'Pilih tipe mutasi untuk mendaftarkan sambungan baru (PB) atau mereaktivasi sambungan lama (PK) ke dalam antrean DPM.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Selector Tipe Mutasi Gaya Vercel Cards (hanya saat tambah baru) */}
          {!isEditingExisting ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Pilih Tipe Mutasi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipeMutasi('PB')}
                  className={cn(
                    'relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all cursor-pointer',
                    tipeMutasi === 'PB'
                      ? 'border-foreground/40 bg-muted/40 shadow-2xs ring-1 ring-border'
                      : 'border-border bg-card hover:bg-muted/20 text-muted-foreground',
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-xs text-foreground w-full">
                    <UserPlus className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold">Pasang Baru (PB)</span>
                    {tipeMutasi === 'PB' && (
                      <Badge variant="blue-subtle" size="sm" className="ml-auto px-1.5 py-0 text-[10px]">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Pendaftaran sambungan baru pelanggan yang belum pernah ada di sistem.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipeMutasi('PK')}
                  className={cn(
                    'relative flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all cursor-pointer',
                    tipeMutasi === 'PK'
                      ? 'border-foreground/40 bg-muted/40 shadow-2xs ring-1 ring-border'
                      : 'border-border bg-card hover:bg-muted/20 text-muted-foreground',
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-xs text-foreground w-full">
                    <Layers className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold">Pemasangan Kembali (PK)</span>
                    {tipeMutasi === 'PK' && (
                      <Badge variant="green-subtle" size="sm" className="ml-auto px-1.5 py-0 text-[10px]">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Reaktivasi sambungan dicabut dengan auto-fetch data dari arsip master.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <span className="font-semibold text-foreground">Tipe Mutasi:</span>
              <Badge
                variant={tipeMutasi === 'PK' ? 'green-subtle' : 'blue-subtle'}
                size="sm"
              >
                {tipeMutasi === 'PK' ? 'Pemasangan Kembali (PK)' : 'Pasang Baru (PB)'}
              </Badge>
            </div>
          )}

          {/* 2. Target Periode DPM (Shadcn UI Select Ringkas & Fungsional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="target-periode"
              className="block text-xs font-semibold text-foreground"
            >
              Target Jadwal Baca (DPM)
            </label>
            <Select value={targetPeriode} onValueChange={setTargetPeriode}>
              <SelectTrigger id="target-periode" className="w-full h-9">
                <SelectValue placeholder="Pilih Periode DPM" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={periodeAktif}>
                  <span className="font-medium text-foreground">
                    {formatPeriodeLabelId(periodeAktif)}
                  </span>{' '}
                  <span className="font-mono text-muted-foreground">
                    ({periodeAktif})
                  </span>{' '}
                  <span className="text-muted-foreground">· Berjalan (Langsung Input Stand)</span>
                </SelectItem>
                {nextPeriode !== periodeAktif && (
                  <SelectItem value={nextPeriode}>
                    <span className="font-medium text-foreground">
                      {formatPeriodeLabelId(nextPeriode)}
                    </span>{' '}
                    <span className="font-mono text-muted-foreground">
                      ({nextPeriode})
                    </span>{' '}
                    <span className="text-muted-foreground">· Bulan Depan</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* MODE A: PASANG BARU (PB) — GRID 2-KOLOM LAPANG */}
          {tipeMutasi === 'PB' && (
            <div className="space-y-3.5 rounded-lg border border-border/80 bg-muted/15 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pb-nolg"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Nomor Sambungan (NOLG)
                  </label>
                  <Input
                    id="pb-nolg"
                    value={nolg}
                    onChange={(e) => setNolg(e.target.value)}
                    placeholder="Contoh: 00901234567"
                    className="h-9 font-mono text-xs"
                    readOnly={isEditingExisting}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pb-nometer"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Nomor Seri Meter Air Baru
                  </label>
                  <Input
                    id="pb-nometer"
                    value={noMeter}
                    onChange={(e) => setNoMeter(e.target.value)}
                    placeholder="Contoh: A26S-167987"
                    className="h-9 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pb-nama"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Nama Lengkap Pelanggan
                  </label>
                  <Input
                    id="pb-nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama pemilik sambungan"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pb-notelp"
                    className="block text-xs font-semibold text-foreground"
                  >
                    No Telepon / WhatsApp (Opsional)
                  </label>
                  <Input
                    id="pb-notelp"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    placeholder="08123456789"
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pb-alamat"
                  className="block text-xs font-semibold text-foreground"
                >
                  Alamat Pemasangan Lengkap
                </label>
                <Input
                  id="pb-alamat"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jalan, No Rumah, RT/RW, Kelurahan"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pb-tarif"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Golongan Tarif
                  </label>
                  <Select value={tarifKode} onValueChange={setTarifKode}>
                    <SelectTrigger id="pb-tarif" className="w-full h-9">
                      <SelectValue placeholder="Pilih tarif" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {masterTarif.map((t) => (
                        <SelectItem key={t.kode} value={t.kode}>
                          <span className="font-mono font-medium">{t.kode}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{t.nama}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pb-rute"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Rute Pembaca (Cater)
                  </label>
                  <Select value={ruteKode} onValueChange={setRuteKode}>
                    <SelectTrigger id="pb-rute" className="w-full h-9">
                      <SelectValue placeholder="Pilih rute" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {masterRute.map((r) => (
                        <SelectItem key={r.kode} value={r.kode}>
                          <span className="font-mono font-medium">{r.kode}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{r.nama}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: PEMASANGAN KEMBALI (PK) — AUTO-FETCH DATA ARSIP */}
          {tipeMutasi === 'PK' && (
            <div className="space-y-3.5 rounded-lg border border-border/80 bg-muted/15 p-4">
              {/* Row Pencarian NOLG */}
              <div className="space-y-1.5">
                <label
                  htmlFor="pk-nolg"
                  className="block text-xs font-semibold text-foreground"
                >
                  Cari Nomor Sambungan (NOLG) Pelanggan Lama
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="pk-nolg"
                      value={pkNolg}
                      onChange={(e) => {
                        setPkNolg(e.target.value);
                        setPkFoundPelanggan(null);
                        setPkSearchError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleCariPelangganPk();
                        }
                      }}
                      placeholder="Ketik NOLG contoh: 00802300160..."
                      className="h-9 pl-9 font-mono text-xs"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCariPelangganPk()}
                    disabled={pkSearching || !pkNolg.trim()}
                    className="h-9 px-3 gap-1.5 shrink-0 bg-background"
                  >
                    {pkSearching ? (
                      <Spinner className="size-3.5" />
                    ) : (
                      <Search className="size-3.5" />
                    )}
                    <span>Cari di Arsip</span>
                  </Button>
                </div>
              </div>

              {pkSearchError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{pkSearchError}</span>
                </div>
              )}

              {/* Kartu Profil Auto-Filled Pelanggan Arsip (Vercel Geist Strip) */}
              {pkFoundPelanggan && (
                <div className="rounded-lg border border-border bg-card p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold text-foreground text-sm">
                        {pkFoundPelanggan.nama}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {pkFoundPelanggan.nolg}
                      </span>
                      <Badge
                        variant={
                          pkFoundPelanggan.status === 'DICABUT'
                            ? 'amber-subtle'
                            : 'outline'
                        }
                        size="sm"
                      >
                        {pkFoundPelanggan.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3.5 shrink-0 mt-0.5" />
                    <span>{pkFoundPelanggan.alamat}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] text-muted-foreground">
                    <div>
                      Rute Cater:{' '}
                      <strong className="text-foreground font-mono font-medium">
                        {pkFoundPelanggan.ruteKode || '—'}
                      </strong>
                    </div>
                    <div>
                      Tarif Terakhir:{' '}
                      <strong className="text-foreground font-mono font-medium">
                        {pkFoundPelanggan.tarifKode || '—'}
                      </strong>
                    </div>
                    <div>
                      Meter Lama:{' '}
                      <strong className="text-foreground font-mono font-medium">
                        {pkFoundPelanggan.noMeter || '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Field Input Mutasi Baru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pk-nometer"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Nomor Seri Meter Pasang Baru
                  </label>
                  <Input
                    id="pk-nometer"
                    value={pkNoMeterBaru}
                    onChange={(e) => setPkNoMeterBaru(e.target.value)}
                    placeholder="Contoh: 106582"
                    className="h-9 font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pk-tarif"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Golongan Tarif Baru
                  </label>
                  <Select value={pkTarifBaru} onValueChange={setPkTarifBaru}>
                    <SelectTrigger id="pk-tarif" className="w-full h-9">
                      <SelectValue placeholder="Pilih tarif" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {masterTarif.map((t) => (
                        <SelectItem key={t.kode} value={t.kode}>
                          <span className="font-mono font-medium">{t.kode}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{t.nama}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="pk-sk"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Nomor SK / Berita Acara (Opsional)
                  </label>
                  <Input
                    id="pk-sk"
                    value={pkNomorSk}
                    onChange={(e) => setPkNomorSk(e.target.value)}
                    placeholder="BA-PK/11/2026/001"
                    className="h-9 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="pk-alasan"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Keterangan Reaktivasi (Opsional)
                  </label>
                  <Input
                    id="pk-alasan"
                    value={pkAlasan}
                    onChange={(e) => setPkAlasan(e.target.value)}
                    placeholder="Pelunasan tunggakan & pemasangan meter air"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Tombol Aksi */}
          <DialogFooter className="border-t border-border pt-3 mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={actionLoading}
              className="h-8 text-xs bg-background"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={actionLoading}
              className="h-8 text-xs gap-1.5"
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>
                {isEditingExisting
                  ? 'Simpan Pembaruan Data'
                  : tipeMutasi === 'PB'
                    ? `Simpan PB ke DPM ${targetPeriode}`
                    : `Simpan PK ke DPM ${targetPeriode}`}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
