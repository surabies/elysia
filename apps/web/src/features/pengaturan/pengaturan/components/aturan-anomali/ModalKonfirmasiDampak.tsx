// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/ModalKonfirmasiDampak.tsx
// Modal Konfirmasi Pengamanan jika Perubahan Berdampak Luas (>100 Baris)

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
import { ShieldAlert } from 'lucide-react';
import type { PreviewData } from './types';

interface ModalKonfirmasiDampakProps {
  open: boolean;
  previewData: PreviewData | null;
  alasanPerubahan: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ModalKonfirmasiDampak({
  open,
  previewData,
  alasanPerubahan,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: ModalKonfirmasiDampakProps) {
  const baris = previewData?.jumlahBarisBerubah ?? previewData?.totalBarisBerubah ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 space-y-3">
        <DialogHeader className="p-0">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-5" />
            <DialogTitle className="text-label-14 font-semibold text-foreground">
              Konfirmasi Perubahan Berdampak Luas
            </DialogTitle>
          </div>
          <DialogDescription className="text-copy-13 text-muted-foreground pt-1">
            Perubahan parameter ini akan memicu penghitungan ulang otomatis dan mengubah status klasifikasi pada{' '}
            <strong className="text-foreground font-semibold">
              {baris.toLocaleString('id-ID')} baris
            </strong>{' '}
            pembacaan meter periode berjalan yang belum closing.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg border border-border bg-muted/20 text-label-12 space-y-1">
          <p className="font-medium text-foreground">Alasan yang akan dicatat ke Audit Trail:</p>
          <p className="text-muted-foreground italic">"{alasanPerubahan}"</p>
        </div>

        <DialogFooter className="p-0 pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Periksa Kembali
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="default"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="h-8 text-xs"
          >
            {isSubmitting ? 'Mengeksekusi…' : 'Ya, Tetap Simpan & Terapkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
