'use client';

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  BarisTargetRealisasi,
  RingkasanTargetRealisasi,
} from '@/server/domain/capaian/capaian.types';
import { formatRibuan, formatDesimal, formatPersen } from './format';
import { ClipboardPaste, Edit2, AlertCircle } from 'lucide-react';

interface TabelTargetRealisasiProps {
  baris: BarisTargetRealisasi[];
  ringkasan: RingkasanTargetRealisasi;
  onUpdateTarget: (bulan: number, targetSl: number, targetM3: number) => Promise<void>;
  onBulkUpdateTarget: (items: Array<{ bulan: number; targetSl: number; targetM3: number }>) => Promise<void>;
  hideHeaderCard?: boolean;
}

export function TabelTargetRealisasi({
  baris,
  ringkasan,
  onUpdateTarget,
  onBulkUpdateTarget,
  hideHeaderCard = false,
}: TabelTargetRealisasiProps) {
  // Editing state: { bulan, field: 'targetSl' | 'targetM3', value }
  const [editingCell, setEditingCell] = React.useState<{
    bulan: number;
    field: 'targetSl' | 'targetM3';
    val: string;
  } | null>(null);
  const [savingBulan, setSavingBulan] = React.useState<number | null>(null);

  // Bulk paste modal
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState('');
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  const startEdit = (bulan: number, field: 'targetSl' | 'targetM3', currentVal: number) => {
    setEditingCell({ bulan, field, val: String(currentVal) });
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const commitEdit = async (item: BarisTargetRealisasi) => {
    if (!editingCell) return;
    const num = parseInt(editingCell.val.replace(/\D/g, ''), 10);
    if (isNaN(num) || num < 0) {
      cancelEdit();
      return;
    }

    const nextTargetSl = editingCell.field === 'targetSl' ? num : item.targetSl;
    const nextTargetM3 = editingCell.field === 'targetM3' ? num : item.targetM3;

    if (nextTargetSl === item.targetSl && nextTargetM3 === item.targetM3) {
      cancelEdit();
      return;
    }

    try {
      setSavingBulan(item.bulan);
      await onUpdateTarget(item.bulan, nextTargetSl, nextTargetM3);
    } finally {
      setSavingBulan(null);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: BarisTargetRealisasi) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(item);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleProcessBulk = async () => {
    setBulkError(null);
    if (!bulkText.trim()) {
      setBulkError('Teks paste tidak boleh kosong.');
      return;
    }

    const lines = bulkText.trim().split('\n');
    const parsedItems: Array<{ bulan: number; targetSl: number; targetM3: number }> = [];

    for (let i = 0; i < lines.length && i < 12; i++) {
      const parts = lines[i].split(/[\t,;]+/).map((s) => s.trim().replace(/\./g, ''));
      if (parts.length >= 2) {
        const sl = parseInt(parts[0], 10);
        const m3 = parseInt(parts[1], 10);
        if (!isNaN(sl) && !isNaN(m3)) {
          parsedItems.push({ bulan: i + 1, targetSl: sl, targetM3: m3 });
        }
      }
    }

    if (parsedItems.length === 0) {
      setBulkError(
        'Format tidak dikenali. Salin 2 kolom (Target SL & Target M³) dari Excel untuk 12 baris.'
      );
      return;
    }

    try {
      await onBulkUpdateTarget(parsedItems);
      setBulkOpen(false);
      setBulkText('');
    } catch (err: any) {
      setBulkError(err.message || 'Gagal menyimpan bulk update');
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Dialog Bulk Paste Modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Tempel Target 12 Bulan dari Excel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Salin 2 kolom dari Excel (Kolom 1: <strong>Target SL</strong>, Kolom 2: <strong>Target M³</strong>) untuk 12 baris bulan Januari s.d. Desember, lalu tempel di bawah:
            </p>
            <Textarea
              placeholder="22450	340000&#10;22470	338000&#10;22490	345000..."
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="font-mono text-xs"
            />
            {bulkError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-md">
                <AlertCircle className="size-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleProcessBulk}>
              Terapkan Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hideHeaderCard && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Target dan Realisasi Capaian Pencatatan
            </h3>
            <p className="text-xs text-muted-foreground">
              Klik pada sel Target untuk melakukan inline editing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
          >
            <ClipboardPaste className="size-3.5" />
            <span>Tempel Excel</span>
          </Button>
        </div>
      )}

      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
          <tr>
            <th className="py-2.5 px-4 font-medium w-[130px]">Bulan</th>
            <th className="py-2.5 px-4 font-medium text-right">Target SL</th>
            <th className="py-2.5 px-4 font-medium text-right">Realisasi SL</th>
            <th className="py-2.5 px-4 font-medium text-right">Capaian SL (%)</th>
            <th className="py-2.5 px-4 font-medium text-right">Target M³</th>
            <th className="py-2.5 px-4 font-medium text-right">Realisasi M³</th>
            <th className="py-2.5 px-4 font-medium text-right">Capaian M³ (%)</th>
            <th className="py-2.5 px-4 font-medium text-right">LPS</th>
            <th className="py-2.5 px-4 font-medium text-right">Selisih M³</th>
            <th className="py-2.5 px-4 font-medium text-right">Selisih LPS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs font-sans">
          {baris.map((b) => {
            const isEditingSl = editingCell?.bulan === b.bulan && editingCell?.field === 'targetSl';
            const isEditingM3 = editingCell?.bulan === b.bulan && editingCell?.field === 'targetM3';
            const isBelum = b.status === 'BELUM';

            return (
              <tr
                key={b.bulan}
                className={`hover:bg-muted/40 transition-colors h-11 ${
                  isBelum ? 'opacity-60 bg-muted/10' : ''
                }`}
              >
                <td className="py-2 px-4 font-medium text-foreground">
                  {b.namaBulan}
                </td>

                {/* Target SL (Editable) */}
                <td
                  className="py-2 px-4 text-right font-mono tabular-nums cursor-pointer group"
                  onClick={() => !isEditingSl && startEdit(b.bulan, 'targetSl', b.targetSl)}
                >
                  {isEditingSl ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={editingCell.val}
                        onChange={(e) =>
                          setEditingCell({ ...editingCell, val: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, b)}
                        onBlur={() => commitEdit(b)}
                        className="w-20 px-1.5 py-0.5 text-right font-mono font-medium text-xs bg-background border border-blue-600 rounded shadow-xs outline-hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                        {formatRibuan(b.targetSl)}
                      </span>
                      <Edit2 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>

                {/* Realisasi SL */}
                <td className="py-2 px-4 text-right font-mono tabular-nums text-foreground">
                  {formatRibuan(b.realisasiSl)}
                </td>

                {/* Capaian SL % */}
                <td className="py-2 px-4 text-right font-mono tabular-nums font-medium text-foreground">
                  {formatPersen(b.capaianSlPersen, 2)}
                </td>

                {/* Target M³ (Editable) */}
                <td
                  className="py-2 px-4 text-right font-mono tabular-nums cursor-pointer group"
                  onClick={() => !isEditingM3 && startEdit(b.bulan, 'targetM3', b.targetM3)}
                >
                  {isEditingM3 ? (
                    <div className="flex items-center justify-end gap-1">
                      <input
                        autoFocus
                        type="text"
                        value={editingCell.val}
                        onChange={(e) =>
                          setEditingCell({ ...editingCell, val: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, b)}
                        onBlur={() => commitEdit(b)}
                        className="w-24 px-1.5 py-0.5 text-right font-mono font-medium text-xs bg-background border border-blue-600 rounded shadow-xs outline-hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                        {formatRibuan(b.targetM3)}
                      </span>
                      <Edit2 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>

                {/* Realisasi M³ */}
                <td className="py-2 px-4 text-right font-mono tabular-nums font-semibold text-foreground">
                  {formatRibuan(b.realisasiM3)}
                </td>

                {/* Capaian M³ % */}
                <td className="py-2 px-4 text-right font-mono tabular-nums">
                  {b.capaianM3Persen !== null ? (
                    <Badge
                      variant={
                        b.capaianM3Persen >= 95
                          ? 'green-subtle'
                          : b.capaianM3Persen >= 90
                          ? 'amber-subtle'
                          : 'red-subtle'
                      }
                      size="sm"
                      className="font-mono font-medium"
                    >
                      {formatPersen(b.capaianM3Persen, 2)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* LPS */}
                <td className="py-2 px-4 text-right font-mono tabular-nums text-foreground/80">
                  {formatDesimal(b.lps, 2)}
                </td>

                {/* Selisih M³ */}
                <td className="py-2 px-4 text-right font-mono tabular-nums font-medium">
                  {b.selisihM3 !== null ? (
                    <span
                      className={
                        b.selisihM3 >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }
                    >
                      {b.selisihM3 >= 0 ? '+' : ''}
                      {formatRibuan(b.selisihM3)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* Selisih LPS */}
                <td className="py-2 px-4 text-right font-mono tabular-nums text-foreground/80">
                  {b.selisihLps !== null ? (
                    <span
                      className={
                        b.selisihLps >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }
                    >
                      {b.selisihLps >= 0 ? '+' : ''}
                      {formatDesimal(b.selisihLps, 2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}

          {/* Baris JUMLAH */}
          <tr className="bg-muted/40 font-semibold border-t-2 border-border text-foreground">
            <td className="py-3 px-4 font-bold text-foreground">JUMLAH</td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatRibuan(ringkasan.rataRataTargetSlYtd)} <span className="text-[10px] text-muted-foreground font-normal">(Rata)</span>
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatRibuan(ringkasan.rataRataRealisasiSlYtd)} <span className="text-[10px] text-muted-foreground font-normal">(Rata)</span>
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatPersen(ringkasan.capaianSlYtdPersen, 2)}
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatRibuan(ringkasan.totalTargetM3Ytd)}
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums text-foreground font-bold">
              {formatRibuan(ringkasan.totalRealisasiM3Ytd)}
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              <Badge variant="blue-subtle" size="sm" className="font-mono font-bold">
                {formatPersen(ringkasan.capaianM3YtdPersen, 2)}
              </Badge>
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatDesimal(ringkasan.rataLpsYtd, 2)} <span className="text-[10px] text-muted-foreground font-normal">(Rata)</span>
            </td>
            <td
              className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                (ringkasan.selisihM3Ytd ?? 0) >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {(ringkasan.selisihM3Ytd ?? 0) >= 0 ? '+' : ''}
              {formatRibuan(ringkasan.selisihM3Ytd)}
            </td>
            <td
              className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                (ringkasan.selisihLpsYtd ?? 0) >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {(ringkasan.selisihLpsYtd ?? 0) >= 0 ? '+' : ''}
              {formatDesimal(ringkasan.selisihLpsYtd, 2)}
            </td>
          </tr>

          {/* Baris CAPAIAN (YTD) */}
          <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-medium border-t border-border">
            <td colSpan={6} className="py-2.5 px-4 text-blue-900 dark:text-blue-300 font-semibold">
              CAPAIAN (YTD: Realisasi s.d. Bulan Berjalan ÷ Target YTD)
            </td>
            <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400 text-sm">
              {formatPersen(ringkasan.capaianM3YtdPersen, 2)}
            </td>
            <td colSpan={3} className="py-2.5 px-4 text-right text-[11px] text-muted-foreground">
              Akumulasi Realisasi ÷ Target Berjalan
            </td>
          </tr>

          {/* Baris CAPAIAN (Tahunan) */}
          <tr className="bg-purple-50/40 dark:bg-purple-950/20 font-medium border-t border-border">
            <td colSpan={6} className="py-2.5 px-4 text-purple-900 dark:text-purple-300 font-semibold">
              CAPAIAN (Tahunan: Realisasi s.d. Bulan Berjalan ÷ Target 12 Bulan)
            </td>
            <td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700 dark:text-purple-400 text-sm">
              {formatPersen(ringkasan.capaianM3TahunanPersen, 2)}
            </td>
            <td colSpan={3} className="py-2.5 px-4 text-right text-[11px] text-muted-foreground font-mono">
              Target 12 Bulan: {formatRibuan(ringkasan.totalTargetM3Tahunan)} m³
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
