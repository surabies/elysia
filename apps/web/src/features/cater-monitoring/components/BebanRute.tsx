'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  Layers,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { RouteSummary } from '../types';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

export function BebanRute({
  routes,
  loading,
}: {
  routes: RouteSummary[];
  loading: boolean;
}) {
  const [search, setSearch] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<'semua' | 'padat' | 'unassigned'>('semua');
  const [selectedRoute, setSelectedRoute] = React.useState<RouteSummary | null>(null);

  // Kapasitas ideal acuan (280 SL)
  const KAPASITAS_ACUAN = 280;

  // Statistik ringkasan
  const stats = React.useMemo(() => {
    if (routes.length === 0) return { totalSL: 0, rataRata: 0, maxSL: 0, unassigned: 0, padatCount: 0 };
    const totalSL = routes.reduce((acc, r) => acc + (r.customerCount || 0), 0);
    const rataRata = Math.round(totalSL / routes.length);
    const maxSL = Math.max(...routes.map((r) => r.customerCount || 0));
    const unassigned = routes.filter(
      (r) => !r.petugasDefault || r.petugasDefault.trim() === '' || r.petugasDefault === '—'
    ).length;
    const padatCount = routes.filter((r) => (r.customerCount || 0) > 220).length;

    return { totalSL, rataRata, maxSL, unassigned, padatCount };
  }, [routes]);

  // Filter rute
  const filteredRoutes = React.useMemo(() => {
    return routes.filter((r) => {
      const matchSearch =
        search.trim() === '' ||
        r.kode.toLowerCase().includes(search.toLowerCase()) ||
        (r.seksiNama && r.seksiNama.toLowerCase().includes(search.toLowerCase())) ||
        (r.petugasDefault && r.petugasDefault.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterMode === 'padat') {
        return (r.customerCount || 0) > 220;
      }
      if (filterMode === 'unassigned') {
        return !r.petugasDefault || r.petugasDefault.trim() === '' || r.petugasDefault === '—';
      }

      return true;
    });
  }, [routes, search, filterMode]);

  const handleToggleFilter = (target: 'padat' | 'unassigned') => {
    setFilterMode((prev) => (prev === target ? 'semua' : target));
  };

  // Helper status kapasitas
  const getKapasitasStatus = (sl: number) => {
    if (sl > 280) {
      return {
        label: 'Overload',
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
        barColor: 'bg-red-500',
      };
    }
    if (sl > 220) {
      return {
        label: 'Padat',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        barColor: 'bg-amber-500',
      };
    }
    return {
      label: 'Ideal',
      badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
      barColor: 'bg-teal-500',
    };
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        {/* ========================================================= */}
        {/* HEADER KARTU                                              */}
        {/* ========================================================= */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-foreground/80 shrink-0" />
                <h2 className="text-heading-16 font-semibold tracking-tight text-[var(--ds-gray-1000)] truncate">
                  Kapasitas &amp; Distribusi Rute
                </h2>
              </div>
              <p className="text-copy-12 text-muted-foreground mt-0.5 truncate">
                Sebaran beban kerja rute binaan terhadap kapasitas optimal lapangan (280 SL)
              </p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setFilterMode('semua')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer border ${
                    filterMode === 'semua'
                      ? 'bg-muted/60 text-foreground border-border'
                      : 'bg-muted/80 text-foreground border-foreground/30 ring-1 ring-border'
                  }`}
                >
                  <span>{routes.length} Rute</span>
                  {filterMode !== 'semua' && (
                    <RotateCcw className="size-3 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{filterMode === 'semua' ? 'Menampilkan semua rute' : 'Klik untuk reset filter'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* 3 KPI Trigger Cards (Senada dengan Radar Anomali) */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60">
            {/* KPI 1: Rata-rata Beban */}
            <div
              onClick={() => setFilterMode('semua')}
              className={`rounded-md p-2.5 border cursor-pointer transition-all ${
                filterMode === 'semua'
                  ? 'bg-muted/50 border-border ring-1 ring-border shadow-xs'
                  : 'bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground" />
                  Rata-rata
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-copy-16 font-bold text-foreground font-mono tabular-nums">
                  {stats.rataRata}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">SL/rute</span>
              </div>
            </div>

            {/* KPI 2: Rute Padat / Overload */}
            <div
              onClick={() => handleToggleFilter('padat')}
              className={`rounded-md p-2.5 border cursor-pointer transition-all ${
                filterMode === 'padat'
                  ? 'bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/15 hover:border-amber-500/40 hover:bg-amber-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <AlertTriangle className="size-3 text-amber-500" />
                  Rute Padat
                </span>
                {filterMode === 'padat' && (
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-copy-16 font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {stats.padatCount}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">&gt;220 SL</span>
              </div>
            </div>

            {/* KPI 3: Belum Ada Petugas */}
            <div
              onClick={() => handleToggleFilter('unassigned')}
              className={`rounded-md p-2.5 border cursor-pointer transition-all ${
                filterMode === 'unassigned'
                  ? 'bg-rose-500/15 border-rose-500/50 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/15 hover:border-rose-500/40 hover:bg-rose-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <UserX className="size-3 text-rose-500" />
                  Kosong
                </span>
                {filterMode === 'unassigned' && (
                  <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-copy-16 font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  {stats.unassigned}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">tanpa petugas</span>
              </div>
            </div>
          </div>

          {/* Quick Search Bar Ringkas */}
          <div className="relative mt-3 pt-1">
            <Search className="absolute left-2.5 top-3.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari rute, seksi, atau petugas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-[12px] bg-muted/30 border-border"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* TABEL GAYA VERCEL (Rapi, Terstruktur, Enak Dipandang)     */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[340px]">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-copy-13 animate-pulse">
              Memuat data sebaran rute…
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-copy-13">
              Tidak ada rute yang cocok dengan filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              {/* Header Kolom Bergaya Vercel Dashboard */}
              <thead className="sticky top-0 z-10 bg-[var(--ds-background-100)] border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2 px-3 font-medium">Kode Rute</th>
                  <th className="py-2 px-2.5 font-medium text-center">Status</th>
                  <th className="py-2 px-3 font-medium">Wilayah / Seksi</th>
                  <th className="py-2 px-3 font-medium">Petugas Binaan</th>
                  <th className="py-2 px-3 font-medium text-right">Beban SL</th>
                  <th className="py-2 px-2.5 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-[12px]">
                {filteredRoutes.map((route) => {
                  const sl = route.customerCount || 0;
                  const status = getKapasitasStatus(sl);
                  const percent = Math.min(100, Math.round((sl / KAPASITAS_ACUAN) * 100));
                  const hasPetugas = Boolean(
                    route.petugasDefault &&
                    route.petugasDefault.trim() !== '' &&
                    route.petugasDefault !== '—'
                  );

                  return (
                    <tr
                      key={route.kode}
                      onClick={() => setSelectedRoute(route)}
                      className="hover:bg-muted/40 transition-colors h-10 cursor-pointer group"
                    >
                      {/* Kolom 1: Kode Rute */}
                      <td className="py-1.5 px-3 font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                        {route.kode}
                      </td>

                      {/* Kolom 2: Status Badge */}
                      <td className="py-1.5 px-2.5 text-center">
                        <Badge variant="outline" className={`text-[10px] font-mono py-0 px-1.5 ${status.badgeClass}`}>
                          {status.label}
                        </Badge>
                      </td>

                      {/* Kolom 3: Wilayah / Seksi */}
                      <td className="py-1.5 px-3 text-[11px] text-muted-foreground truncate max-w-[140px]">
                        {route.seksiNama || 'Wilayah Umum'}
                      </td>

                      {/* Kolom 4: Petugas Default */}
                      <td className="py-1.5 px-3 text-[11px]">
                        {hasPetugas ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium truncate max-w-[140px]">
                            <UserCheck className="size-3 text-teal-500 shrink-0" />
                            <span className="truncate">{route.petugasDefault}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                            <UserX className="size-3 shrink-0" />
                            <span className="italic">Belum ditugaskan</span>
                          </div>
                        )}
                      </td>

                      {/* Kolom 5: Beban SL & Progress Bar */}
                      <td className="py-1.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 hidden md:block">
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${status.barColor} rounded-full`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-foreground tabular-nums whitespace-nowrap">
                            {formatNumber(sl)} <span className="text-[10px] font-normal text-muted-foreground">SL</span>
                          </span>
                        </div>
                      </td>

                      {/* Kolom 6: Aksi Tinjau */}
                      <td className="py-1.5 px-2.5 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 hover:bg-muted font-medium cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoute(route);
                              }}
                            >
                              <Eye className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Lihat detail kapasitas rute {route.kode}</p>
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
        {/* FOOTER KARTU (Link Navigasi)                               */}
        {/* ========================================================= */}
        <Link
          href="/master/pemetaan-petugas"
          className="flex h-9 items-center justify-between border-t border-border bg-[var(--ds-background-100)] px-4 text-[11px] font-medium text-muted-foreground hover:bg-[var(--ds-background-200)] hover:text-foreground transition-colors"
        >
          <span>Buka Pengaturan Pemetaan Rute &amp; Beban Kerja Petugas</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* ========================================================= */}
      {/* MODAL DIALOG DETAIL RUTE                                  */}
      {/* ========================================================= */}
      {selectedRoute && (
        <Dialog open={Boolean(selectedRoute)} onOpenChange={(open) => !open && setSelectedRoute(null)}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-heading-18 font-bold flex items-center gap-2">
                <span>Rute {selectedRoute.kode}</span>
                <Badge
                  variant="outline"
                  className={`text-label-12 font-mono ${getKapasitasStatus(selectedRoute.customerCount || 0).badgeClass}`}
                >
                  {getKapasitasStatus(selectedRoute.customerCount || 0).label}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Detail wilayah operasional dan alokasi petugas pembacaan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-copy-13">
              <div className="rounded-md bg-muted/40 p-3 border border-border/70 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-label-12">Wilayah / Seksi:</span>
                  <span className="font-semibold text-foreground">
                    {selectedRoute.seksiNama || 'Wilayah Umum'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-label-12">Petugas Pembina Default:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    {selectedRoute.petugasDefault && selectedRoute.petugasDefault !== '—' ? (
                      <>
                        <UserCheck className="size-3.5 text-teal-500" />
                        {selectedRoute.petugasDefault}
                      </>
                    ) : (
                      <>
                        <UserX className="size-3.5 text-red-500" />
                        <span className="text-red-500">Belum Ditugaskan</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Progress Kapasitas Rute */}
              <div className="rounded-md border border-border p-3 space-y-2">
                <div className="flex justify-between items-center text-label-12">
                  <span className="text-muted-foreground">Total Pelanggan Terdaftar:</span>
                  <span className="font-mono text-copy-14 font-bold text-foreground">
                    {formatNumber(selectedRoute.customerCount || 0)} Sambungan (SL)
                  </span>
                </div>
                <div className="flex justify-between items-center text-label-12">
                  <span className="text-muted-foreground">Kapasitas Ideal Standar:</span>
                  <span className="font-mono font-medium text-muted-foreground">
                    {KAPASITAS_ACUAN} SL / Rute
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${getKapasitasStatus(selectedRoute.customerCount || 0).barColor} rounded-full`}
                    style={{
                      width: `${Math.min(100, Math.round(((selectedRoute.customerCount || 0) / KAPASITAS_ACUAN) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/master/pemetaan-petugas?rute=${selectedRoute.kode}`}>
                  Ubah Alokasi Petugas
                </Link>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedRoute(null)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
