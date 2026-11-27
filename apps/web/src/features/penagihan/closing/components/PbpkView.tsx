'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Info,
  Layers,
  Plus,
  Save,
  Search,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  MiddleTruncate,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@cater/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  ClosingSmoothPanel,
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/penagihan/closing/components/shared';
import { cn } from '@/lib/utils';
import { usePbpkManager } from '../hooks/use-pbpk-manager';
import {
  computeNextPeriode,
  formatAngkaId,
  formatPeriodeLabelId,
} from '../lib/closing-format';
import type { PasangBaruItem, SimpanBacaanPbpkItem } from '../types';
import { ClosingSubNavBar } from './ClosingSubNavBar';
import { PbpkPasangBaruDialog } from './PbpkPasangBaruDialog';

/**
 * Helper Kontrak Vercel Geist untuk teks panjang di tabel compact:
 * memotong satu baris (`truncate`) tanpa merusak tinggi baris, dilengkapi Tooltip instan.
 */
function CompactTruncateCell({
  text,
  maxWidthClass = 'max-w-[160px]',
  mono = false,
  className,
}: {
  text: string;
  maxWidthClass?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'block truncate cursor-default text-xs',
            maxWidthClass,
            mono && 'font-mono tabular-nums',
            className,
          )}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

interface DraftStandState {
  standAwal: string;
  standAkhir: string;
}

export function PbpkView() {
  const {
    periode,
    daftarPeriode,
    setPeriode,
    data,
    loading,
    refreshing,
    actionLoading,
    feedback,
    setFeedback,
    searchQuery,
    setSearchQuery,
    showPbDialog,
    setShowPbDialog,
    filteredPb,
    loadData,
    handleSimpanPasangBaru,
    handleSimpanPerubahanKategori,
    handleSimpanBacaanPbpk,
  } = usePbpkManager();

  const nextPeriode = data?.periodeDepan || computeNextPeriode(periode);
  const [editingItem, setEditingItem] = React.useState<PasangBaruItem | null>(
    null,
  );
  const [filterStand, setFilterStand] = React.useState<
    'ALL' | 'BELUM_INPUT' | 'TERCATAT'
  >('ALL');

  // State input inline Stand Awal & Stand Akhir per NOLG
  const [draftStands, setDraftStands] = React.useState<
    Record<string, DraftStandState>
  >({});

  // Sinkronkan nilai awal input stand dari database setiap kali daftar PBPK dimuat
  React.useEffect(() => {
    const map: Record<string, DraftStandState> = {};
    for (const item of data?.daftarPasangBaru ?? []) {
      const initAwal = item.stml ?? item.dpmStandAwal ?? 0;
      const initAkhir = item.stma !== null && item.stma !== undefined ? String(item.stma) : '';
      map[item.nolg] = {
        standAwal: String(initAwal),
        standAkhir: initAkhir,
      };
    }
    setDraftStands(map);
  }, [data?.daftarPasangBaru]);

  const periodOptionsWithNext = React.useMemo(() => {
    const list = [...daftarPeriode];
    if (nextPeriode && !list.some((p) => p.periode === nextPeriode)) {
      list.unshift({ periode: nextPeriode, status: 'BERJALAN' });
    }
    return list;
  }, [daftarPeriode, nextPeriode]);

  const belumInputStandCount = React.useMemo(
    () =>
      (data?.daftarPasangBaru ?? []).filter(
        (p) => p.stma === null || p.stma === undefined,
      ).length,
    [data?.daftarPasangBaru],
  );

  const displayedRows = React.useMemo(() => {
    if (filterStand === 'BELUM_INPUT') {
      return filteredPb.filter((p) => p.stma === null || p.stma === undefined);
    }
    if (filterStand === 'TERCATAT') {
      return filteredPb.filter((p) => p.stma !== null && p.stma !== undefined);
    }
    return filteredPb;
  }, [filteredPb, filterStand]);

  const isRowDirtyOrNew = React.useCallback(
    (p: PasangBaruItem): boolean => {
      const draft = draftStands[p.nolg];
      if (!draft || draft.standAkhir.trim() === '') return false;
      const awalNum = Number(draft.standAwal);
      const akhirNum = Number(draft.standAkhir);
      if (Number.isNaN(awalNum) || Number.isNaN(akhirNum) || akhirNum < awalNum) {
        return false;
      }
      if (p.stma === null || p.stma === undefined) {
        return true;
      }
      return awalNum !== (p.stml ?? 0) || akhirNum !== p.stma;
    },
    [draftStands],
  );

  const dirtyItemsToSave = React.useMemo<SimpanBacaanPbpkItem[]>(() => {
    const items: SimpanBacaanPbpkItem[] = [];
    for (const p of data?.daftarPasangBaru ?? []) {
      if (!isRowDirtyOrNew(p)) continue;
      const draft = draftStands[p.nolg]!;
      items.push({
        nolg: p.nolg,
        standAwal: Number(draft.standAwal),
        standAkhir: Number(draft.standAkhir),
      });
    }
    return items;
  }, [data?.daftarPasangBaru, draftStands, isRowDirtyOrNew]);

  const handleSaveSingleRow = async (p: PasangBaruItem) => {
    const draft = draftStands[p.nolg];
    if (!draft || draft.standAkhir.trim() === '') return;
    const standAwal = Number(draft.standAwal);
    const standAkhir = Number(draft.standAkhir);
    await handleSimpanBacaanPbpk([{ nolg: p.nolg, standAwal, standAkhir }]);
  };

  const handleSaveBatch = async () => {
    if (dirtyItemsToSave.length === 0) return;
    await handleSimpanBacaanPbpk(dirtyItemsToSave);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <PageContainer className="space-y-4">
        <PageSectionHeader
          title="2. PBPK"
          description={`Daftar mutasi Pasang Baru & Pasang Kembali pada DPM ${formatPeriodeLabelId(periode)} beserta input pemakaian stand meter.`}
          badge={
            <Badge variant="blue-subtle" size="md">
              Periode {periode}
            </Badge>
          }
          actions={
            <PeriodFilterBar
              periode={periode}
              options={periodOptionsWithNext}
              onPeriodeChange={setPeriode}
              onRefresh={loadData}
              loading={loading || refreshing}
              label="Periode DPM"
            />
          }
        />

        <ClosingSubNavBar />

        <ClosingSmoothPanel refreshing={refreshing}>
          <StatusFeedbackBanner
            feedback={feedback}
            onDismiss={() => setFeedback(null)}
          />

        {/* Strip Telemetri Geist Hairline */}
        <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          <div className="space-y-1 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Pelanggan Aktif Saat Ini
              </span>
              <Users className="size-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-base font-semibold text-foreground">
                {loading
                  ? '—'
                  : formatAngkaId(data?.ringkasan.totalMasterPelanggan ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">SL</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Diluar sambungan berstatus DICABUT
            </p>
          </div>

          <div className="space-y-1 border-border px-4 py-3 sm:border-l lg:border-l-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Pasang Baru (PB) · {periode}
              </span>
              <UserPlus className="size-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-base font-semibold text-foreground">
                {loading
                  ? '—'
                  : formatAngkaId(data?.ringkasan.totalPasangBaru ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">SL</span>
            </div>
            <p
              className={cn(
                'text-[11px]',
                belumInputStandCount > 0
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {belumInputStandCount > 0
                ? `${belumInputStandCount} SL menunggu input stand`
                : 'Seluruh PB sudah tercatat stand'}
            </p>
          </div>

          <div className="space-y-1 border-border px-4 py-3 sm:border-t lg:border-t-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Pasang Kembali (PK) · {periode}
              </span>
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-base font-semibold text-foreground">
                {loading
                  ? '—'
                  : formatAngkaId(data?.ringkasan.totalPerubahanKategori ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">SL</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Reaktivasi sambungan periode ini
            </p>
          </div>

          <div className="space-y-1 border-border px-4 py-3 sm:border-t sm:border-l lg:border-t-0 lg:border-l-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Sisa Laporan Petugas DPM
              </span>
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-base font-semibold text-foreground">
                {loading
                  ? '—'
                  : formatAngkaId(data?.ringkasan.belumDilaporkanPetugas ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground">SL</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Masuk:{' '}
              {formatAngkaId(data?.ringkasan.sudahDilaporkanPetugas ?? 0)} SL
            </p>
          </div>
        </div>

        {/* Panel Toolbar Vercel Grey Terpadu */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-border bg-muted/40 p-2 sm:p-2.5">
          {/* Sisi Kiri: Segmented Filter (Semua, Belum Baca, Tercatat) & Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5 text-xs">
              {(
                [
                  { id: 'ALL', label: `Semua (${filteredPb.length})` },
                  {
                    id: 'BELUM_INPUT',
                    label: `Belum Baca (${belumInputStandCount})`,
                  },
                  {
                    id: 'TERCATAT',
                    label: `Tercatat (${filteredPb.length - belumInputStandCount})`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStand(f.id)}
                  className={cn(
                    'rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                    filterStand === f.id
                      ? 'bg-muted text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {belumInputStandCount > 0 && (
              <Badge variant="amber-subtle" size="sm" className="hidden sm:inline-flex">
                {belumInputStandCount} Belum Input Stand
              </Badge>
            )}
          </div>

          {/* Sisi Kanan: Pencarian, Simpan Stand, Import CSV, Tambah Mutasi PBPK */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-56 flex items-center">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                size="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari NOLG / nama..."
                className="h-8 pl-8 font-mono text-xs bg-background"
              />
            </div>

            {dirtyItemsToSave.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveBatch}
                disabled={actionLoading}
                className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {actionLoading ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>
                  Simpan Semua Stand ({dirtyItemsToSave.length} SL)
                </span>
              </Button>
            )}

            <Button asChild variant="outline" size="sm" className="h-8 bg-background">
              <Link href="/import/pbpk">
                <Upload className="size-3.5" />
                <span>Import CSV PBPK</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setShowPbDialog(true);
              }}
              className="h-8 bg-background gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Tambah Mutasi PBPK</span>
            </Button>
          </div>
        </div>

        {/* Tabel High-Density Berdiri Sendiri */}
        <div className="space-y-2.5">
          <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-2xs">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/35">
                    <TableRow className="h-8">
                      <TableHead className="h-8 w-12 px-2.5 text-[11px] font-semibold">
                        Tipe
                      </TableHead>
                      <TableHead className="h-8 w-28 px-2.5 text-[11px] font-semibold">
                        NOLG
                      </TableHead>
                      <TableHead className="h-8 px-2.5 text-[11px] font-semibold">
                        Nama Pelanggan
                      </TableHead>
                      <TableHead className="h-8 px-2.5 text-[11px] font-semibold">
                        Alamat
                      </TableHead>
                      <TableHead className="h-8 w-16 px-2 text-center text-[11px] font-semibold">
                        Tarif
                      </TableHead>
                      <TableHead className="h-8 w-18 px-2 text-center text-[11px] font-semibold">
                        Rute
                      </TableHead>
                      <TableHead className="h-8 w-28 px-2.5 text-[11px] font-semibold">
                        No. Meter
                      </TableHead>
                      <TableHead className="h-8 w-24 px-2 text-right text-[11px] font-semibold">
                        Stand Awal
                      </TableHead>
                      <TableHead className="h-8 w-24 px-2 text-right text-[11px] font-semibold">
                        Stand Akhir
                      </TableHead>
                      <TableHead className="h-8 w-22 px-2.5 text-right text-[11px] font-semibold">
                        Pemakaian
                      </TableHead>
                      <TableHead className="h-8 w-28 px-2.5 text-center text-[11px] font-semibold">
                        Status / Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="py-8 text-center text-xs text-muted-foreground"
                        >
                          Memuat data mutasi PBPK periode {periode}...
                        </TableCell>
                      </TableRow>
                    ) : displayedRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="py-8 text-center text-xs text-muted-foreground"
                        >
                          Tidak ada data PBPK sesuai filter pada periode{' '}
                          {formatPeriodeLabelId(periode)} ({periode}).
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedRows.map((p) => {
                        const isPlaceholderAddress =
                          p.alamat === 'Alamat Terdata LapDataMeter';
                        const draft = draftStands[p.nolg] ?? {
                          standAwal: String(p.stml ?? p.dpmStandAwal ?? 0),
                          standAkhir:
                            p.stma !== null && p.stma !== undefined
                              ? String(p.stma)
                              : '',
                        };

                        const awalNum = Number(draft.standAwal);
                        const akhirNum =
                          draft.standAkhir.trim() === ''
                            ? null
                            : Number(draft.standAkhir);
                        const isStandMundur =
                          akhirNum !== null &&
                          !Number.isNaN(akhirNum) &&
                          akhirNum < awalNum;
                        const livePakai =
                          akhirNum !== null && !Number.isNaN(akhirNum)
                            ? Math.max(0, Number((akhirNum - awalNum).toFixed(2)))
                            : p.pakaiM3;
                        const dirty = isRowDirtyOrNew(p);
                        const sudahTercatat =
                          p.stma !== null && p.stma !== undefined;

                        return (
                          <TableRow
                            key={p.nolg}
                            className={cn(
                              'h-9 transition-colors',
                              !sudahTercatat && 'bg-amber-500/[0.03]',
                            )}
                          >
                            {/* 1. Tipe */}
                            <TableCell className="px-2.5 py-1.5">
                              <Badge
                                variant={
                                  p.mutasian === 'PK'
                                    ? 'green-subtle'
                                    : 'blue-subtle'
                                }
                                size="sm"
                                className="px-1.5 py-0 font-mono text-[10px]"
                              >
                                {p.mutasian ?? 'PB'}
                              </Badge>
                            </TableCell>

                            {/* 2. NOLG */}
                            <TableCell className="px-2.5 py-1.5 font-mono text-xs font-medium tabular-nums text-foreground">
                              {p.nolg}
                            </TableCell>

                            {/* 3. Nama Pelanggan (Compact Geist Truncate + Tooltip) */}
                            <TableCell className="px-2.5 py-1.5">
                              <CompactTruncateCell
                                text={p.nama}
                                maxWidthClass="max-w-[145px]"
                                className="font-medium text-foreground"
                              />
                            </TableCell>

                            {/* 4. Alamat (Compact Geist Truncate + Tooltip) */}
                            <TableCell className="px-2.5 py-1.5">
                              <CompactTruncateCell
                                text={p.alamat}
                                maxWidthClass="max-w-[175px]"
                                className={
                                  isPlaceholderAddress
                                    ? 'italic text-amber-600 dark:text-amber-400'
                                    : 'text-muted-foreground'
                                }
                              />
                            </TableCell>

                            {/* 5. Tarif (Terpisah) */}
                            <TableCell className="px-2 py-1.5 text-center">
                              <Badge
                                variant="outline"
                                size="sm"
                                className="px-1.5 py-0 font-mono text-[11px]"
                              >
                                {p.tarifKode ?? '—'}
                              </Badge>
                            </TableCell>

                            {/* 6. Rute (Terpisah) */}
                            <TableCell className="px-2 py-1.5 text-center font-mono text-xs text-muted-foreground">
                              {p.ruteKode ?? '—'}
                            </TableCell>

                            {/* 7. No. Meter (Geist MiddleTruncate untuk seri panjang) */}
                            <TableCell className="px-2.5 py-1.5">
                              {p.noMeter ? (
                                <MiddleTruncate
                                  text={p.noMeter}
                                  start={5}
                                  end={5}
                                  className="text-xs text-foreground"
                                />
                              ) : (
                                <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                                  Belum isi
                                </span>
                              )}
                            </TableCell>

                            {/* 8. Stand Awal (Terpisah & Editable Inline) */}
                            <TableCell className="px-2 py-1 text-right">
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                aria-label={`Stand awal ${p.nolg}`}
                                value={draft.standAwal}
                                onChange={(e) =>
                                  setDraftStands((prev) => ({
                                    ...prev,
                                    [p.nolg]: {
                                      standAwal: e.target.value,
                                      standAkhir: draft.standAkhir,
                                    },
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && dirty) {
                                    e.preventDefault();
                                    void handleSaveSingleRow(p);
                                  }
                                }}
                                className="ml-auto h-7 w-20 px-2 text-right font-mono text-xs tabular-nums"
                              />
                            </TableCell>

                            {/* 9. Stand Akhir (Terpisah & Editable Inline) */}
                            <TableCell className="px-2 py-1 text-right">
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                placeholder="Isi..."
                                aria-label={`Stand akhir ${p.nolg}`}
                                value={draft.standAkhir}
                                onChange={(e) =>
                                  setDraftStands((prev) => ({
                                    ...prev,
                                    [p.nolg]: {
                                      standAwal: draft.standAwal,
                                      standAkhir: e.target.value,
                                    },
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && dirty) {
                                    e.preventDefault();
                                    void handleSaveSingleRow(p);
                                  }
                                }}
                                className={cn(
                                  'ml-auto h-7 w-20 px-2 text-right font-mono text-xs tabular-nums',
                                  !sudahTercatat &&
                                    draft.standAkhir === '' &&
                                    'border-amber-500/50 bg-background',
                                  isStandMundur &&
                                    'border-destructive text-destructive',
                                )}
                              />
                            </TableCell>

                            {/* 10. Pemakaian (= Stand Akhir - Stand Awal, Terpisah) */}
                            <TableCell className="px-2.5 py-1.5 text-right font-mono text-xs font-semibold tabular-nums">
                              {isStandMundur ? (
                                <span className="text-[11px] text-destructive">
                                  Invalid
                                </span>
                              ) : livePakai !== null &&
                                livePakai !== undefined ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {formatAngkaId(livePakai)} m³
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>

                            {/* 11. Status & Aksi Compact */}
                            <TableCell className="px-2 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {dirty ? (
                                  <Button
                                    type="button"
                                    size="xs"
                                    disabled={actionLoading || isStandMundur}
                                    onClick={() => void handleSaveSingleRow(p)}
                                    className="h-6 px-2 text-[11px]"
                                  >
                                    <Check className="size-3" />
                                    <span>Simpan</span>
                                  </Button>
                                ) : sudahTercatat ? (
                                  <Badge
                                    variant="green-subtle"
                                    size="sm"
                                    className="px-1.5 py-0 text-[10px]"
                                  >
                                    Tercatat
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="amber-subtle"
                                    size="sm"
                                    className="px-1.5 py-0 text-[10px]"
                                  >
                                    Isi Stand
                                  </Badge>
                                )}

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label={`Edit atribut ${p.nolg}`}
                                      onClick={() => {
                                        setEditingItem(p);
                                        setShowPbDialog(true);
                                      }}
                                      className="size-6 text-muted-foreground hover:text-foreground"
                                    >
                                      <Edit3 className="size-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    Edit No. Meter / Alamat / Tarif
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Catatan Ringkas di Bawah Tabel */}
              <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                <Info className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>
                  Tekan <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">Enter</kbd>{' '}
                  pada kolom Stand Akhir untuk menyimpan baris, atau klik{' '}
                  <strong>Simpan Semua Stand</strong> di toolbar atas untuk menyimpan sekaligus.
                </span>
              </div>
            </div>
        </ClosingSmoothPanel>

        <PbpkPasangBaruDialog
          open={showPbDialog}
          onOpenChange={(open) => {
            setShowPbDialog(open);
            if (!open) setEditingItem(null);
          }}
          periodeAktif={periode}
          initialItem={editingItem}
          masterTarif={data?.masterTarif ?? []}
          masterRute={data?.masterRute ?? []}
          actionLoading={actionLoading}
          onSubmit={handleSimpanPasangBaru}
          onSubmitPerubahanKategori={handleSimpanPerubahanKategori}
        />
      </PageContainer>
    </TooltipProvider>
  );
}
