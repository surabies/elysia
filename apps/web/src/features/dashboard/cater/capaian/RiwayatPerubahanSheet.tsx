'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { formatRibuan } from './format';
import { History, User, Clock, ArrowRight } from 'lucide-react';

interface RiwayatItem {
  id: string;
  wilayahId: string;
  tahun: number;
  aksi: string;
  dataSebelum: any;
  dataSesudah: any;
  diubahOleh: string;
  createdAt: string | Date;
}

interface RiwayatPerubahanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riwayat: RiwayatItem[];
}

export const RiwayatPerubahanSheet: React.FC<RiwayatPerubahanSheetProps> = ({
  open,
  onOpenChange,
  riwayat,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-(--ds-gray-200)">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-(--ds-gray-200) text-(--ds-gray-900)">
              <History className="w-4 h-4" />
            </span>
            <SheetTitle className="text-base font-semibold text-(--ds-gray-1000)">
              Riwayat Perubahan Data
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-(--ds-gray-700)">
            Catatan log audit setiap kali target atau realisasi diubah oleh operator/sistem.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-3">
          {riwayat.length === 0 ? (
            <div className="text-center py-8 text-xs text-(--ds-gray-500)">
              Belum ada riwayat perubahan yang tercatat.
            </div>
          ) : (
            riwayat.map((r) => {
              const date = new Date(r.createdAt);
              const formattedDate = date.toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={r.id}
                  className="p-3 bg-(--ds-background-100) border border-(--ds-gray-200) rounded-lg shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold border-transparent bg-(--ds-gray-200) text-(--ds-gray-900)"
                    >
                      {r.aksi}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] text-(--ds-gray-600) tabular-nums">
                      <Clock className="w-3 h-3" />
                      {formattedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-(--ds-gray-700)">
                    <User className="w-3 h-3 text-(--ds-gray-500)" />
                    <span>Diubah oleh:</span>
                    <strong className="text-(--ds-gray-900)">{r.diubahOleh}</strong>
                  </div>

                  {/* Detail Payload Perubahan */}
                  {r.dataSesudah && (
                    <div className="p-2 bg-(--ds-gray-100)/70 rounded border border-(--ds-gray-200)/50 font-mono text-[11px] space-y-1">
                      {r.aksi === 'UPDATE_TARGET' && (
                        <div>
                          Bulan: {r.dataSesudah.bulan} | Target SL:{' '}
                          {formatRibuan(r.dataSesudah.targetSl)} | Target M³:{' '}
                          {formatRibuan(r.dataSesudah.targetM3)} (v{r.dataSesudah.versi})
                        </div>
                      )}
                      {r.aksi === 'BULK_UPDATE_TARGET' && (
                        <div>
                          Bulk update {r.dataSesudah.jumlahBulan} bulan target sekaligus.
                        </div>
                      )}
                      {r.aksi === 'UPDATE_REALISASI' && (
                        <div>
                          Bulan: {r.dataSesudah.bulan} | SL:{' '}
                          {formatRibuan(r.dataSesudah.realisasiSl)} | M³:{' '}
                          {formatRibuan(r.dataSesudah.realisasiM3)} ({r.dataSesudah.sumber})
                        </div>
                      )}
                      {r.aksi === 'SYNC_OTOMATIS' && (
                        <div>
                          Sinkronisasi otomatis berhasil ({r.dataSesudah.updatedCount} bulan).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
