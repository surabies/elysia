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
import type { CreatePasangBaruPayload, MasterOptionItem } from '../types';

interface PbpkPasangBaruDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterTarif: MasterOptionItem[];
  masterRute: MasterOptionItem[];
  actionLoading: boolean;
  onSubmit: (payload: CreatePasangBaruPayload) => Promise<boolean>;
}

export function PbpkPasangBaruDialog({
  open,
  onOpenChange,
  masterTarif,
  masterRute,
  actionLoading,
  onSubmit,
}: PbpkPasangBaruDialogProps) {
  const [nolg, setNolg] = React.useState('');
  const [nama, setNama] = React.useState('');
  const [alamat, setAlamat] = React.useState('');
  const [tarifKode, setTarifKode] = React.useState('2A2');
  const [ruteKode, setRuteKode] = React.useState('CD104');
  const [noMeter, setNoMeter] = React.useState('');
  const [noTelp, setNoTelp] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSubmit({
      nolg,
      nama,
      alamat,
      tarifKode,
      ruteKode,
      noMeter,
      noTelp: noTelp.trim() || undefined,
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-foreground" />
            <span>Pendaftaran Pasang Baru (SL Baru)</span>
          </DialogTitle>
          <DialogDescription>
            Masukkan data sambungan langganan baru yang telah terpasang fisik di
            lapangan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <label
              htmlFor="pb-nolg"
              className="block text-label-13 text-foreground"
            >
              Nomor Sambungan (NOLG)
            </label>
            <Input
              id="pb-nolg"
              value={nolg}
              onChange={(e) => setNolg(e.target.value)}
              placeholder="Contoh: 00901234567"
              className="font-mono"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pb-nama"
              className="block text-label-13 text-foreground"
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
              className="block text-label-13 text-foreground"
            >
              Alamat Pemasangan
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
                className="block text-label-13 text-foreground"
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
                className="block text-label-13 text-foreground"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="pb-nometer"
                className="block text-label-13 text-foreground"
              >
                Nomor Seri Meter
              </label>
              <Input
                id="pb-nometer"
                value={noMeter}
                onChange={(e) => setNoMeter(e.target.value)}
                placeholder="Contoh: 24089912"
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pb-notelp"
                className="block text-label-13 text-foreground"
              >
                No Telepon / WhatsApp
              </label>
              <Input
                id="pb-notelp"
                value={noTelp}
                onChange={(e) => setNoTelp(e.target.value)}
                placeholder="08123456789"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={actionLoading}>
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Daftarkan Sambungan Baru</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
