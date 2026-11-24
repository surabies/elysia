'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { pelangganApi } from '../api';
import type { PelangganKontakItem } from '../types';

export function ModalEditKontak({
  pelanggan,
  open,
  onOpenChange,
  onSuccess,
}: {
  pelanggan: PelangganKontakItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [noTelp, setNoTelp] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  // Sinkronkan input saat dialog dibuka
  React.useEffect(() => {
    if (open && pelanggan) {
      setNoTelp(pelanggan.noTelp ?? '');
    }
  }, [open, pelanggan]);

  // Validasi real-time nomor ponsel
  const cleanDigits = noTelp.replace(/\D/g, '');
  const isMobilePattern = /^(08|628|\+628)[0-9]{8,11}$/.test(noTelp.trim());
  const isLandline = /^0[1-7][0-9]{6,9}$/.test(cleanDigits);
  const isEmpty = noTelp.trim() === '';

  // Buat link WA format 62
  const waTarget = React.useMemo(() => {
    if (!isMobilePattern) return null;
    let digits = cleanDigits;
    if (digits.startsWith('08')) {
      digits = '62' + digits.slice(1);
    } else if (digits.startsWith('8')) {
      digits = '62' + digits;
    }
    return `https://wa.me/${digits}`;
  }, [cleanDigits, isMobilePattern]);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelanggan) return;

    try {
      setSaving(true);
      const res = await pelangganApi.updateKontak(pelanggan.nolg, noTelp.trim());
      toast.success(res.message || 'Nomor kontak berhasil diperbarui');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan perubahan kontak');
    } finally {
      setSaving(false);
    }
  };

  const handleFormatStandar = () => {
    let digits = cleanDigits;
    if (digits.startsWith('628')) {
      digits = '08' + digits.slice(3);
    } else if (digits.startsWith('8')) {
      digits = '08' + digits.slice(1);
    }
    setNoTelp(digits);
  };

  if (!pelanggan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSimpan}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-heading-18">
              <Phone className="size-5 text-(--ds-blue-700)" />
              Perbarui Nomor Kontak / WhatsApp
            </DialogTitle>
            <DialogDescription className="text-copy-13 text-(--ds-gray-900)">
              Lengkapi nomor seluler pelanggan untuk notifikasi pembacaan meter, tagihan DRD, dan verifikasi lapangan.
            </DialogDescription>
          </DialogHeader>

          {/* Kartu Ringkas Pelanggan */}
          <div className="my-4 p-3 rounded-md bg-(--ds-gray-200) border border-(--ds-gray-400) text-copy-13 space-y-1">
            <div className="flex justify-between items-center font-medium text-(--ds-gray-1000)">
              <span>{pelanggan.nama}</span>
              <span className="font-mono text-label-12 text-(--ds-blue-700) bg-(--ds-blue-100) px-1.5 py-0.5 rounded">
                {pelanggan.nolg}
              </span>
            </div>
            <p className="text-(--ds-gray-900) truncate">{pelanggan.alamat}</p>
            <div className="flex gap-2 text-label-12 text-(--ds-gray-800) pt-1">
              <span>Rute: <strong className="font-mono">{pelanggan.ruteKode ?? '-'}</strong></span>
              <span>•</span>
              <span>Tarif: <strong className="font-mono">{pelanggan.tarifKode ?? '-'}</strong></span>
              <span>•</span>
              <span>No. Meter: <strong className="font-mono">{pelanggan.noMeter ?? '-'}</strong></span>
            </div>
          </div>

          {/* Form Input Kontak */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="noTelp" className="text-label-13 font-medium">
                  Nomor HP / WhatsApp
                </Label>
                <div className="flex gap-1.5">
                  {cleanDigits.length > 0 && (
                    <button
                      type="button"
                      onClick={handleFormatStandar}
                      className="text-label-11 text-(--ds-blue-700) hover:underline cursor-pointer"
                    >
                      Format 08xx
                    </button>
                  )}
                  {noTelp && (
                    <button
                      type="button"
                      onClick={() => setNoTelp('')}
                      className="text-label-11 text-(--ds-red-700) hover:underline flex items-center gap-0.5 cursor-pointer ml-1.5"
                    >
                      <Trash2 className="size-3" /> Kosongkan
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <Input
                  id="noTelp"
                  type="text"
                  placeholder="Contoh: 081234567890 atau 628123456789"
                  value={noTelp}
                  onChange={(e) => setNoTelp(e.target.value)}
                  className="font-mono text-copy-14 pl-9"
                  autoFocus
                />
                <Phone className="size-4 text-(--ds-gray-700) absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Validasi & Status Preview */}
            <div className="p-2.5 rounded-md border text-copy-12">
              {isEmpty ? (
                <div className="flex items-center gap-2 text-(--ds-amber-800)">
                  <AlertTriangle className="size-4 text-(--ds-amber-700) shrink-0" />
                  <span>Nomor kontak akan dikosongkan (status: Belum Ada Kontak).</span>
                </div>
              ) : isMobilePattern ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-(--ds-green-800)">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4 text-(--ds-green-700) shrink-0" />
                      <span>Format WhatsApp Terverifikasi</span>
                    </div>
                    <Badge variant="green-subtle" size="sm">
                      Valid WA
                    </Badge>
                  </div>
                  {waTarget && (
                    <div className="pt-1">
                      <a
                        href={waTarget}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-label-12 text-(--ds-green-700) hover:text-(--ds-green-800) font-medium underline"
                      >
                        <MessageCircle className="size-3.5" />
                        Uji Chat WhatsApp ({cleanDigits})
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : isLandline ? (
                <div className="flex items-center gap-2 text-(--ds-blue-800)">
                  <Phone className="size-4 text-(--ds-blue-700) shrink-0" />
                  <span>Terdeteksi nomor telepon kabel lokal. Pemberitahuan WA tidak dapat dikirim otomatis.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-(--ds-red-800)">
                  <AlertTriangle className="size-4 text-(--ds-red-700) shrink-0" />
                  <span>Nomor tidak memenuhi standar seluler Indonesia (08xx, 10–13 digit).</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-5 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Kontak'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
