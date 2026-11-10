'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  ExternalLink,
  HelpCircle,
  Radio,
  RotateCcw,
  TrendingDown,
  TrendingUp,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AnomaliKPI, ReadingReviewItem } from '../types';

function formatVolume(value: number | string | null) {
  return `${Number(value ?? 0).toLocaleString('id-ID')} m³`;
}

export function PembacaanDitinjau({
  periodLabel,
  extremeReadings = [],
  zeroReadings = [],
  downReadings = [],
  anomaliKPI,
  allAnomaliItems = [],
  loading,
  error,
}: {
  periodLabel: string;
  extremeReadings?: ReadingReviewItem[];
  zeroReadings?: ReadingReviewItem[];
  downReadings?: ReadingReviewItem[];
  anomaliKPI?: AnomaliKPI;
  allAnomaliItems?: ReadingReviewItem[];
  loading: boolean;
  error: string | null;
}) {
  const [filterKategori, setFilterKategori] = React.useState<'semua' | 'ekstrem' | 'nol' | 'turun'>('semua');
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);
  const [verifiedMap, setVerifiedMap] = React.useState<Record<string, boolean>>({});

  // Sinkronisasi KPI 1:1 dengan Anomali Kubikasi (/progres/ekstrim)
  const totalEkstrim = anomaliKPI?.totalEkstrim ?? extremeReadings.length;
  const totalNol = anomaliKPI?.totalNol ?? zeroReadings.length;
  const totalTurun = anomaliKPI?.totalTurun ?? downReadings.length;
  const totalAnomali = anomaliKPI?.totalAnomali ?? (totalEkstrim + totalNol + totalTurun);

  // Helper normalisasi satu item
  const mapItem = React.useCallback((item: ReadingReviewItem, fallbackKategori?: 'ekstrem' | 'nol' | 'turun') => {
    const pakai = Number(item.pakaiM3 ?? 0);
    const lalu = Number(item.pakaiLalu ?? 0);
    const selisih = item.selisihM3 ?? (pakai - lalu);
    const deviasi = item.persenDeviasi ?? (lalu > 0 ? Math.round(((pakai - lalu) / lalu) * 100) : 0);

    let kategori: 'ekstrem' | 'nol' | 'turun' = fallbackKategori ?? 'ekstrem';
    if (!fallbackKategori) {
      const jenisRaw = (item.jenisAnomali ?? '').toUpperCase();
      if (jenisRaw === 'NOL' || pakai === 0) {
        kategori = 'nol';
      } else if (jenisRaw === 'TURUN' || (lalu >= 10 && pakai <= lalu * 0.5)) {
        kategori = 'turun';
      } else {
        kategori = 'ekstrem';
      }
    }

    let alasan = `Deviasi ${deviasi > 0 ? `+${deviasi}%` : `${deviasi}%`} (${lalu} m³ → ${pakai} m³)`;
    if (kategori === 'ekstrem') {
      alasan = pakai > 100
        ? `Pemakaian sangat tinggi (${pakai} m³), potensi kebocoran / salah catat`
        : `Lonjakan ${deviasi > 0 ? `+${deviasi}%` : ''} dari bulan lalu (${lalu} m³ → ${pakai} m³)`;
    } else if (kategori === 'nol') {
      alasan = lalu > 0
        ? `Pemakaian 0 m³ (Bulan lalu: ${lalu} m³). Potensi meter macet / rumah kosong`
        : 'Pemakaian 0 m³ beruntun (Stand meter tidak bergerak)';
    } else if (kategori === 'turun') {
      alasan = `Penurunan drastis ${deviasi}% dari bulan lalu (${lalu} m³ → ${pakai} m³)`;
    }

    return {
      ...item,
      kategori,
      selisihM3: selisih,
      persenDeviasi: deviasi,
      alasan,
    };
  }, []);

  // Filter langsung berdasarkan array kategori terdedikasi (100% menjamin data stand 0 selalu tampil & bebas duplikasi)
  const displayedItems = React.useMemo(() => {
    let list: any[] = [];
    if (filterKategori === 'nol') {
      list = zeroReadings.map((item) => mapItem(item, 'nol'));
    } else if (filterKategori === 'ekstrem') {
      list = extremeReadings.map((item) => mapItem(item, 'ekstrem'));
    } else if (filterKategori === 'turun') {
      list = downReadings.map((item) => mapItem(item, 'turun'));
    } else {
      list = allAnomaliItems.length > 0
        ? allAnomaliItems.map((item) => mapItem(item))
        : [
            ...extremeReadings.map((item) => mapItem(item, 'ekstrem')),
            ...zeroReadings.map((item) => mapItem(item, 'nol')),
            ...downReadings.map((item) => mapItem(item, 'turun')),
          ];
    }

    // Deduplikasi ketat berdasarkan ID
    const uniqueMap = new Map<string, any>();
    for (const item of list) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    return Array.from(uniqueMap.values());
  }, [filterKategori, zeroReadings, extremeReadings, downReadings, allAnomaliItems, mapItem]);

  const handleToggleFilter = (target: 'ekstrem' | 'nol' | 'turun') => {
    setFilterKategori((prev) => (prev === target ? 'semua' : target));
  };

  const handleVerifikasiCepat = (id: string) => {
    setVerifiedMap((prev) => ({ ...prev, [id]: true }));
    setSelectedItem(null);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        {/* ========================================================= */}
        {/* HEADER KARTU (Vercel Style dengan Reset Filter)           */}
        {/* ========================================================= */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-rose-500 animate-pulse shrink-0" />
                <h2 className="text-heading-16 font-semibold tracking-tight text-[var(--ds-gray-1000)] truncate">
                  Radar Anomali Pembacaan
                </h2>
              </div>
              <p className="text-copy-12 text-muted-foreground mt-0.5 truncate">
                Deteksi dini lonjakan ekstrem, penurunan drastis, dan stand 0 m³ pada {periodLabel}
              </p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setFilterKategori('semua')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer border ${
                    filterKategori === 'semua'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 ring-1 ring-rose-500/20'
                      : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{totalAnomali.toLocaleString('id-ID')} Total</span>
                  {filterKategori !== 'semua' && (
                    <RotateCcw className="size-3 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{filterKategori === 'semua' ? 'Menampilkan semua anomali' : 'Klik untuk reset ke semua anomali'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* 3 KPI Trigger Cards (Pemicu Filter Langsung) */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60">
            {/* KPI 1: Lonjakan Ekstrem */}
            <div
              onClick={() => handleToggleFilter('ekstrem')}
              className={`rounded-md p-2.5 border cursor-pointer transition-all ${
                filterKategori === 'ekstrem'
                  ? 'bg-red-500/15 border-red-500/50 ring-2 ring-red-500/20 shadow-xs'
                  : 'bg-red-500/5 dark:bg-red-950/20 border-red-500/15 hover:border-red-500/40 hover:bg-red-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <TrendingUp className="size-3 text-red-500" />
                  Ekstrem
                </span>
                {filterKategori === 'ekstrem' && (
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-copy-16 font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
                  {totalEkstrim.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">kasus</span>
              </div>
            </div>

            {/* KPI 2: Pemakaian Nol */}
            <div
              onClick={() => handleToggleFilter('nol')}
              className={`rounded-md p-2.5 border cursor-pointer transition-all ${
                filterKategori === 'nol'
                  ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/15 hover:border-amber-500/40 hover:bg-amber-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <HelpCircle className="size-3 text-amber-500" />
                  Stand 0 m³
                </span>
                {filterKategori === 'nol' && (
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-copy-16 font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {totalNol.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">kasus</span>
              </div>
            </div>

            {/* KPI 3: Turun Drastis */}
            <div
              onClick={() => handleToggleFilter('turun')}
              className={`rounded-md p-2.5 border cursor-pointer transition-all ${
                filterKategori === 'turun'
                  ? 'bg-blue-500/15 border-blue-500/50 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/15 hover:border-blue-500/40 hover:bg-blue-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <TrendingDown className="size-3 text-blue-500" />
                  Turun Drastis
                </span>
                {filterKategori === 'turun' && (
                  <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-copy-16 font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  {totalTurun.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">kasus</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TABEL GAYA VERCEL (Rapi, Terstruktur, Enak Dipandang)     */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[340px]">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-copy-13 animate-pulse">
              Memuat data pemeriksaan anomali nyata…
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500 text-copy-13 px-4">
              Gagal memuat anomali: {error}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-copy-13 flex flex-col items-center gap-1.5">
              <CheckCircle className="size-6 text-teal-500" />
              <span>Tidak ada temuan anomali pada filter ini.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              {/* Header Kolom Bergaya Vercel Dashboard */}
              <thead className="sticky top-0 z-10 bg-[var(--ds-background-100)] border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2 px-3 font-medium">Pelanggan</th>
                  <th className="py-2 px-2.5 font-medium text-center">Rute</th>
                  <th className="py-2 px-3 font-medium text-right">Stand (Lalu → Kini)</th>
                  <th className="py-2 px-3 font-medium text-right">Volume</th>
                  <th className="py-2 px-3 font-medium text-center">Deviasi</th>
                  <th className="py-2 px-2.5 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-[12px]">
                {displayedItems.map((item, idx) => {
                  const isEkstrem = item.kategori === 'ekstrem';
                  const isNol = item.kategori === 'nol';
                  const isTurun = item.kategori === 'turun';
                  const isVerified = Boolean(verifiedMap[item.id]);
                  const deviasi = item.persenDeviasi ?? 0;
                  const selisih = item.selisihM3 ?? 0;
                  const pakaiLalu = Number(item.pakaiLalu ?? 0);
                  const pakaiKini = Number(item.pakaiM3 ?? 0);

                  const volumeColor = isEkstrem
                    ? 'text-red-600 dark:text-red-400'
                    : isTurun
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400';

                  const badgeStyle = isEkstrem
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25'
                    : isTurun
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';

                  return (
                    <tr
                      key={`${item.id}-${item.kategori}-${idx}`}
                      className="hover:bg-muted/40 transition-colors h-10 group"
                    >
                      {/* Kolom 1: Pelanggan (Nama + No Lg) */}
                      <td className="py-1.5 px-3 max-w-[180px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-foreground truncate" title={item.nama}>
                            {item.nama}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1 py-0.2 rounded shrink-0">
                            {item.nolg}
                          </span>
                        </div>
                      </td>

                      {/* Kolom 2: Rute */}
                      <td className="py-1.5 px-2.5 text-center font-mono text-[11px] text-muted-foreground">
                        {item.ruteKode || '—'}
                      </td>

                      {/* Kolom 3: Stand Lalu → Stand Kini */}
                      <td className="py-1.5 px-3 text-right font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                        <span>{item.stml ?? '0'}</span>
                        <span className="mx-1 text-muted-foreground/40">→</span>
                        <span className="font-medium text-foreground">{item.stma ?? '0'}</span>
                      </td>

                      {/* Kolom 4: Volume Lalu → Kini */}
                      <td className="py-1.5 px-3 text-right font-mono text-[11px] tabular-nums whitespace-nowrap">
                        <span className="text-muted-foreground">{pakaiLalu} m³</span>
                        <span className="mx-1 text-muted-foreground/40">→</span>
                        <strong className={volumeColor}>{pakaiKini} m³</strong>
                      </td>

                      {/* Kolom 5: Badge Deviasi */}
                      <td className="py-1.5 px-3 text-center">
                        {isVerified ? (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-teal-500/10 text-teal-600 border-teal-500/30 gap-1 font-mono">
                            <Check className="size-3" /> Verif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={`text-[10px] font-mono py-0 px-1.5 ${badgeStyle}`}>
                            {isEkstrem
                              ? deviasi > 0 ? `+${deviasi}%` : 'Ekstrem'
                              : isTurun
                              ? `${deviasi}%`
                              : '0 m³'}
                          </Badge>
                        )}
                      </td>

                      {/* Kolom 6: Aksi Tinjau */}
                      <td className="py-1.5 px-2.5 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 hover:bg-muted font-medium cursor-pointer"
                              onClick={() => setSelectedItem(item)}
                            >
                              <Eye className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{item.alasan}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOOTER KARTU (Navigasi Dual Senada)                       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-[var(--ds-background-100)]">
          <Link
            href="/progres/ekstrim"
            className="flex h-9 items-center justify-center gap-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:bg-[var(--ds-background-200)] hover:text-foreground transition-colors"
          >
            <span>Buka Analitik Penuh (/progres/ekstrim)</span>
            <ExternalLink className="size-3" />
          </Link>
          <Link
            href="/verifikasi/baca-petugas"
            className="flex h-9 items-center justify-center gap-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:bg-[var(--ds-background-200)] hover:text-foreground transition-colors"
          >
            <span>Buka Panel Verifikasi Lengkap</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DIALOG TINJAU METER RIIL                            */}
      {/* ========================================================= */}
      {selectedItem && (
        <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-heading-18 font-bold">
                Tinjau Pembacaan Meter Riil
              </DialogTitle>
              <DialogDescription>
                Komparasi angka stand &amp; pemakaian No Lg {selectedItem.nolg}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-copy-13">
              {/* Profil Pelanggan & Petugas Binaan */}
              <div className="rounded-md bg-muted/40 p-3 border border-border/70 space-y-1">
                <p className="font-semibold text-foreground text-copy-14">{selectedItem.nama}</p>
                <p className="text-muted-foreground text-label-12 font-mono">
                  No Lg: {selectedItem.nolg} · Rute: {selectedItem.ruteKode || '—'}
                </p>
                <p className="text-muted-foreground text-label-12">
                  Petugas Catat: {selectedItem.petugasNama || 'Petugas Lapangan'}
                </p>
              </div>

              {/* Grid Komparasi Stand Meter */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border p-2.5 text-center">
                  <span className="text-[11px] text-muted-foreground block">Stand Lalu (STML)</span>
                  <span className="font-mono text-copy-16 font-bold text-foreground">
                    {selectedItem.stml ?? '0'}
                  </span>
                </div>
                <div className="rounded-md border border-border p-2.5 text-center">
                  <span className="text-[11px] text-muted-foreground block">Stand Kini (STMA)</span>
                  <span className="font-mono text-copy-16 font-bold text-foreground">
                    {selectedItem.stma ?? '0'}
                  </span>
                </div>
              </div>

              {/* Komparasi Pemakaian Kini vs Lalu vs Historis */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-border p-2 text-center bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                    Bulan Lalu
                  </span>
                  <span className="font-mono text-copy-14 font-semibold text-foreground">
                    {formatVolume(selectedItem.pakaiLalu ?? 0)}
                  </span>
                </div>

                <div
                  className={`rounded-md border p-2 text-center ${
                    selectedItem.kategori === 'turun'
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <span
                    className={`text-[10px] block uppercase font-medium ${
                      selectedItem.kategori === 'turun'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    Bulan Ini (Pakai)
                  </span>
                  <span
                    className={`font-mono text-copy-14 font-bold ${
                      selectedItem.kategori === 'turun'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatVolume(selectedItem.pakaiM3)}
                  </span>
                </div>

                <div className="rounded-md border border-border p-2 text-center bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                    Rata-rata 3 Bln
                  </span>
                  <span className="font-mono text-copy-14 font-semibold text-foreground">
                    {formatVolume(selectedItem.rataRataHistoris ?? selectedItem.pakaiLalu ?? 0)}
                  </span>
                </div>
              </div>

              {/* Ringkasan Analisis Selisih & Deviasi */}
              <div className="rounded-md border border-border p-3 space-y-1.5 bg-muted/30">
                <div className="flex items-center justify-between text-label-12">
                  <span className="text-muted-foreground">Selisih Volume (m³):</span>
                  <span className="font-mono font-semibold text-foreground">
                    {selectedItem.selisihM3 > 0 ? `+${selectedItem.selisihM3}` : selectedItem.selisihM3} m³
                  </span>
                </div>
                <div className="flex items-center justify-between text-label-12">
                  <span className="text-muted-foreground">Persentase Deviasi:</span>
                  <span
                    className={`font-mono font-semibold ${
                      selectedItem.persenDeviasi > 0
                        ? 'text-red-600 dark:text-red-400'
                        : selectedItem.persenDeviasi < 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600'
                    }`}
                  >
                    {selectedItem.persenDeviasi > 0 ? `+${selectedItem.persenDeviasi}%` : `${selectedItem.persenDeviasi}%`}
                  </span>
                </div>
                {selectedItem.ketCatat && (
                  <div className="flex items-center justify-between text-label-12 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Keterangan Catat Lapangan:</span>
                    <span className="font-medium text-foreground">{selectedItem.ketCatat}</span>
                  </div>
                )}
              </div>

              {/* Catatan / Keterangan Deteksi */}
              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-label-12 text-amber-800 dark:text-amber-300">
                <p className="font-medium">Catatan Deteksi Sistem:</p>
                <p className="mt-0.5">{selectedItem.alasan}</p>
              </div>
            </div>

            <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/verifikasi/baca-petugas?nolg=${selectedItem.nolg}`}>
                  Buka Panel Penuh
                </Link>
              </Button>
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-500 text-white gap-1.5"
                onClick={() => handleVerifikasiCepat(selectedItem.id)}
              >
                <Check className="size-4" />
                <span>Setujui &amp; Verifikasi</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
