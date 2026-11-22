'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarisProgresBulanan,
  RingkasanTabelProgres,
} from '@/server/domain/capaian/capaian.types';
import {
  formatRibuan,
  formatDesimal,
  formatDelta,
} from './format';
import { Baseline } from 'lucide-react';

interface TabelProgresBulananProps {
  baris: BarisProgresBulanan[];
  ringkasan: RingkasanTabelProgres;
  onUpdateBaselineDesember: (sl: number, m3: number) => Promise<void>;
  hideHeaderCard?: boolean;
}

export function TabelProgresBulanan({
  baris,
  ringkasan,
  onUpdateBaselineDesember,
  hideHeaderCard = false,
}: TabelProgresBulananProps) {
  const [openBaselineModal, setOpenBaselineModal] = React.useState(false);
  const baselineItem = baris.find((b) => b.bulan === 0);
  const [slBaseline, setSlBaseline] = React.useState(String(baselineItem?.realisasiSl ?? 22428));
  const [m3Baseline, setM3Baseline] = React.useState(String(baselineItem?.realisasiM3 ?? 345989));
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (baselineItem) {
      setSlBaseline(String(baselineItem.realisasiSl ?? 22428));
      setM3Baseline(String(baselineItem.realisasiM3 ?? 345989));
    }
  }, [baselineItem]);

  const handleSaveBaseline = async () => {
    const sl = parseInt(slBaseline.replace(/\D/g, ''), 10);
    const m3 = parseInt(m3Baseline.replace(/\D/g, ''), 10);
    if (isNaN(sl) || isNaN(m3)) return;

    try {
      setIsSaving(true);
      await onUpdateBaselineDesember(sl, m3);
      setOpenBaselineModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Modal Edit Baseline Desember Tahun Lalu */}
      <Dialog open={openBaselineModal} onOpenChange={setOpenBaselineModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Ubah Baseline Desember Tahun Lalu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground">
                Realisasi Sambungan Langganan (SL)
              </label>
              <Input
                type="text"
                value={slBaseline}
                onChange={(e) => setSlBaseline(e.target.value)}
                className="mt-1 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">
                Realisasi Kubikasi (M³)
              </label>
              <Input
                type="text"
                value={m3Baseline}
                onChange={(e) => setM3Baseline(e.target.value)}
                className="mt-1 text-sm font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenBaselineModal(false)}
            >
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveBaseline} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hideHeaderCard && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Progress Capaian Target Wilayah Pelayanan
            </h3>
            <p className="text-xs text-muted-foreground">
              Riwayat realisasi sambungan langganan, kubikasi, rasio konsumsi, dan fluktuasi delta bulanan.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenBaselineModal(true)}
            className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
          >
            <Baseline className="size-3.5 text-muted-foreground" />
            <span>Ubah Baseline Des (Lalu)</span>
          </Button>
        </div>
      )}

      <table className="w-full text-left border-collapse">
        <thead className="bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
          <tr>
            <th className="py-2.5 px-4 font-medium w-[140px]">Bulan</th>
            <th className="py-2.5 px-4 font-medium text-right">Hari</th>
            <th className="py-2.5 px-4 font-medium text-right">Realisasi SL</th>
            <th className="py-2.5 px-4 font-medium text-right">Realisasi M³</th>
            <th className="py-2.5 px-4 font-medium text-right">M³/SL</th>
            <th className="py-2.5 px-4 font-medium text-right">M³/SL/Hari</th>
            <th className="py-2.5 px-4 font-medium text-right">Δ SL</th>
            <th className="py-2.5 px-4 font-medium text-right">Δ M³</th>
            <th className="py-2.5 px-4 font-medium text-right">Δ M³/SL</th>
            <th className="py-2.5 px-4 font-medium text-right">Δ M³/SL/Hari</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 text-xs font-sans">
          {baris.map((b) => {
            const isBaseline = b.bulan === 0;
            const isBelum = b.status === 'BELUM' && !isBaseline;
            const deltaSl = formatDelta(b.deltaSl);
            const deltaM3 = formatDelta(b.deltaM3);
            const deltaM3PerSl = formatDelta(b.deltaM3PerSl, 2);
            const deltaM3PerSlPerHari = formatDelta(b.deltaM3PerSlPerHari, 3);

            return (
              <tr
                key={b.bulan}
                className={`hover:bg-muted/40 transition-colors h-11 ${
                  isBaseline
                    ? 'bg-muted/20 font-medium'
                    : isBelum
                    ? 'opacity-60 bg-muted/10'
                    : ''
                }`}
              >
                <td className="py-2 px-4 font-medium text-foreground flex items-center gap-2">
                  <span>{b.namaBulan}</span>
                  {isBaseline && (
                    <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1 border-muted-foreground/30 text-muted-foreground">
                      Acuan
                    </Badge>
                  )}
                </td>
                <td className="py-2 px-4 text-right font-mono tabular-nums text-muted-foreground">
                  {b.jumlahHari}
                </td>
                <td className="py-2 px-4 text-right font-mono tabular-nums text-foreground">
                  {formatRibuan(b.realisasiSl)}
                </td>
                <td className="py-2 px-4 text-right font-mono tabular-nums font-semibold text-foreground">
                  {formatRibuan(b.realisasiM3)}
                </td>
                <td className="py-2 px-4 text-right font-mono tabular-nums font-medium text-foreground">
                  {formatDesimal(b.m3PerSl, 2)}
                </td>
                <td className="py-2 px-4 text-right font-mono tabular-nums text-foreground/80">
                  {formatDesimal(b.m3PerSlPerHari, 3)}
                </td>

                {/* Delta SL */}
                <td className="py-2 px-4 text-right font-mono tabular-nums">
                  <span
                    className={
                      deltaSl.status === 'positif'
                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                        : deltaSl.status === 'negatif'
                        ? 'text-rose-700 dark:text-rose-400 font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {deltaSl.text}
                  </span>
                </td>

                {/* Delta M³ */}
                <td className="py-2 px-4 text-right font-mono tabular-nums">
                  <span
                    className={
                      deltaM3.status === 'positif'
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                        : deltaM3.status === 'negatif'
                        ? 'text-rose-700 dark:text-rose-400 font-semibold'
                        : 'text-muted-foreground'
                    }
                  >
                    {deltaM3.text}
                  </span>
                </td>

                {/* Delta M³/SL */}
                <td className="py-2 px-4 text-right font-mono tabular-nums">
                  <span
                    className={
                      deltaM3PerSl.status === 'positif'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : deltaM3PerSl.status === 'negatif'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-muted-foreground'
                    }
                  >
                    {deltaM3PerSl.text}
                  </span>
                </td>

                {/* Delta M³/SL/Hari */}
                <td className="py-2 px-4 text-right font-mono tabular-nums">
                  <span
                    className={
                      deltaM3PerSlPerHari.status === 'positif'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : deltaM3PerSlPerHari.status === 'negatif'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-muted-foreground'
                    }
                  >
                    {deltaM3PerSlPerHari.text}
                  </span>
                </td>
              </tr>
            );
          })}

          {/* Baris JUMLAH / RATA-RATA */}
          <tr className="bg-muted/40 font-semibold border-t-2 border-border text-foreground">
            <td className="py-3 px-4 font-bold text-foreground">JUMLAH / RATA-RATA</td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {ringkasan.totalHari}
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatRibuan(ringkasan.rataRataSl)} <span className="text-[10px] text-muted-foreground font-normal">(Rata)</span>
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-foreground">
              {formatRibuan(ringkasan.totalM3)} <span className="text-[10px] text-muted-foreground font-normal">(Total)</span>
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatDesimal(ringkasan.m3PerSlTertimbang, 2)} <span className="text-[10px] text-muted-foreground font-normal">(Tertimbang)</span>
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums">
              {formatDesimal(ringkasan.rataM3PerSlPerHari, 3)}
            </td>
            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
              +{formatRibuan(ringkasan.netDeltaSl)} Net
            </td>
            <td
              className={`py-3 px-4 text-right font-mono tabular-nums font-bold ${
                ringkasan.netDeltaM3 >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {ringkasan.netDeltaM3 >= 0 ? '+' : ''}
              {formatRibuan(ringkasan.netDeltaM3)} Net
            </td>
            <td className="py-3 px-4 text-right text-muted-foreground">—</td>
            <td className="py-3 px-4 text-right text-muted-foreground">—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
