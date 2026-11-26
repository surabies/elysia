'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';
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
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { computeNextPeriode, formatPeriodeLabelId } from '../lib/closing-format';
import type {
  CreatePasangBaruPayload,
  MasterOptionItem,
  PasangBaruItem,
} from '../types';

interface PbpkPasangBaruDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodeAktif: string;
  initialItem?: PasangBaruItem | null;
  masterTarif: MasterOptionItem[];
  masterRute: MasterOptionItem[];
  actionLoading: boolean;
  onSubmit: (payload: CreatePasangBaruPayload) => Promise<boolean>;
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
}: PbpkPasangBaruDialogProps) {
  const nextPeriode = computeNextPeriode(periodeAktif);
  const isEditingExisting = Boolean(initialItem);

  const [targetPeriode, setTargetPeriode] = React.useState(nextPeriode);
  const [nolg, setNolg] = React.useState('');
  const [nama, setNama] = React.useState('');
  const [alamat, setAlamat] = React.useState('');
  const [tarifKode, setTarifKode] = React.useState('2A2');
  const [ruteKode, setRuteKode] = React.useState('CD104');
  const [noMeter, setNoMeter] = React.useState('');
  const [noTelp, setNoTelp] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    if (initialItem) {
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
    } else {
      setTargetPeriode(periodeAktif);
      setNolg('');
      setNama('');
      setAlamat('');
      setTarifKode('2A2');
      setRuteKode(masterRute[0]?.kode || 'CD104');
      setNoMeter('');
      setNoTelp('');
    }
  }, [open, initialItem, periodeAktif, nextPeriode, masterRute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setNolg('');
      setNama('');
      setAlamat('');
      setNoMeter('');
      setNoTelp('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="size-4 text-foreground" />
            <span>
              {isEditingExisting
                ? `Lengkapi Nomor Meter & Alamat (${initialItem?.nolg})`
                : 'Input Sambungan Pasang Baru (PB)'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {isEditingExisting
              ? 'Perbarui nomor seri water meter, alamat jalan, atau golongan tarif pelanggan PBPK.'
              : 'Untuk input PBPK akhir bulan (tgl 29 setelah verifikasi), pilih jadwal DPM Bulan Depan agar tidak menghambat tutup buku bulan berjalan. Data ini aman diperkaya ulang saat CSV aplikasi eksternal keluar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <label
              htmlFor="pb-periode"
              className="block text-xs font-semibold text-foreground"
            >
              Target Jadwal Baca (DPM)
            </label>
            <NativeSelect
              id="pb-periode"
              value={targetPeriode}
              onChange={(e) => setTargetPeriode(e.target.value)}
            >
              <option value={periodeAktif}>
                {formatPeriodeLabelId(periodeAktif)} ({periodeAktif}) — Periode Berjalan (Langsung Input Stand di 2. PBPK)
              </option>
              <option value={nextPeriode}>
                {formatPeriodeLabelId(nextPeriode)} ({nextPeriode}) — Antrean Bulan Depan
              </option>
            </NativeSelect>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className="font-mono"
                readOnly={isEditingExisting}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pb-nometer"
                className="block text-xs font-semibold text-foreground"
              >
                Nomor Seri Meter Air
              </label>
              <Input
                id="pb-nometer"
                value={noMeter}
                onChange={(e) => setNoMeter(e.target.value)}
                placeholder="Contoh: A26S-167987"
                className="font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pb-nama"
              className="block text-xs font-semibold text-foreground"
            >
              Nama Pelanggan
            </label>
            <Input
              id="pb-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap pemilik sambungan"
              required
            />
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
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="pb-tarif"
                className="block text-xs font-semibold text-foreground"
              >
                Golongan Tarif
              </label>
              <NativeSelect
                id="pb-tarif"
                value={tarifKode}
                onChange={(e) => setTarifKode(e.target.value)}
              >
                {masterTarif.map((t) => (
                  <option key={t.kode} value={t.kode}>
                    {t.kode} - {t.nama}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pb-rute"
                className="block text-xs font-semibold text-foreground"
              >
                Rute Pembaca (Cater)
              </label>
              <NativeSelect
                id="pb-rute"
                value={ruteKode}
                onChange={(e) => setRuteKode(e.target.value)}
              >
                {masterRute.map((r) => (
                  <option key={r.kode} value={r.kode}>
                    {r.kode} - {r.nama}
                  </option>
                ))}
              </NativeSelect>
            </div>
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
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={actionLoading}>
              {actionLoading && <Spinner className="size-3.5" />}
              <span>
                {isEditingExisting
                  ? 'Simpan Pembaruan Data'
                  : `Simpan ke DPM ${targetPeriode}`}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
