'use client';

import * as React from 'react';
import {
  Users,
  Route,
  Plus,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ListOrdered,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { masterApi } from '../api';

export interface RuteMappingItem {
  kode: string;
  seksiKode: string | null;
  seksiNama: string | null;
  pencatatDefault: string | null;
  namaPetugas: string | null;
  totalPelanggan: number;
  statusSementara: boolean;
  noUrut: number;
}

export interface PetugasSummaryOption {
  id: string;
  nama: string;
  totalRute: number;
  totalSl: number;
}

export function PemetaanPetugasRute() {
  const [activeTab, setActiveTab] = React.useState<string>('penugasan');

  // Master Data
  const [routes, setRoutes] = React.useState<RuteMappingItem[]>([]);
  const [petugasOptions, setPetugasOptions] = React.useState<PetugasSummaryOption[]>([]);
  const [wilayahOptions, setWilayahOptions] = React.useState<{ kode: string; nama: string }[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Tab 1: Penugasan State
  const [selectedPetugasId, setSelectedPetugasId] = React.useState<string>('');
  const [searchPetugas, setSearchPetugas] = React.useState<string>('');
  const [selectedRuteToAdd, setSelectedRuteToAdd] = React.useState<string>('');
  const [statusSementaraToAdd, setStatusSementaraToAdd] = React.useState<string>('TIDAK');
  const [savingAssign, setSavingAssign] = React.useState<boolean>(false);
  const [deletingRuteKode, setDeletingRuteKode] = React.useState<string | null>(null);
  const [searchRutePetugas, setSearchRutePetugas] = React.useState<string>('');

  // Tab 2: Urutan Rute State
  const [selectedWilayahUrutan, setSelectedWilayahUrutan] = React.useState<string>('ALL');
  const [selectedPetugasUrutan, setSelectedPetugasUrutan] = React.useState<string>('');
  const [urutanList, setUrutanList] = React.useState<RuteMappingItem[]>([]);
  const [savingUrutan, setSavingUrutan] = React.useState<boolean>(false);
  const [hasUrutanChanges, setHasUrutanChanges] = React.useState<boolean>(false);

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await masterApi.pemetaan.getData();
      if (data) {
        const fetchedRoutes: RuteMappingItem[] = data.rute || [];
        const fetchedPetugas: PetugasSummaryOption[] = data.petugasOptions || [];
        const fetchedWilayah: { kode: string; nama: string }[] = data.wilayahOptions || [];

        setRoutes(fetchedRoutes);
        setPetugasOptions(fetchedPetugas);
        setWilayahOptions(fetchedWilayah);

        // Set default selected petugas if not set
        if (fetchedPetugas.length > 0 && !selectedPetugasId) {
          setSelectedPetugasId(fetchedPetugas[0].id);
        }
        if (fetchedPetugas.length > 0 && !selectedPetugasUrutan) {
          setSelectedPetugasUrutan(fetchedPetugas[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load rute mapping:', err);
      toast.error(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }, [selectedPetugasId, selectedPetugasUrutan]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Active Petugas Object for Tab 1
  const activePetugas = React.useMemo(() => {
    return petugasOptions.find((p) => p.id === selectedPetugasId) ?? null;
  }, [petugasOptions, selectedPetugasId]);

  // Routes assigned to active petugas in Tab 1
  const assignedRoutesForPetugas = React.useMemo(() => {
    if (!selectedPetugasId) return [];
    return routes.filter((r) => r.pencatatDefault === selectedPetugasId);
  }, [routes, selectedPetugasId]);

  // Filtered assigned routes by search in Tab 1
  const filteredAssignedRoutes = React.useMemo(() => {
    if (!searchRutePetugas.trim()) return assignedRoutesForPetugas;
    const q = searchRutePetugas.toLowerCase().trim();
    return assignedRoutesForPetugas.filter(
      (r) =>
        r.kode.toLowerCase().includes(q) ||
        (r.seksiNama && r.seksiNama.toLowerCase().includes(q))
    );
  }, [assignedRoutesForPetugas, searchRutePetugas]);

  // Available routes for adding (PENGAMAN ANTI DUPLIKAT)
  // 1. Rute yang sudah ada di petugas ini DIKECUALIKAN dari daftar dropdown
  const availableRoutesToAdd = React.useMemo(() => {
    return routes
      .filter((r) => r.pencatatDefault !== selectedPetugasId)
      .sort((a, b) => a.kode.localeCompare(b.kode));
  }, [routes, selectedPetugasId]);

  // Info of selected route to add (e.g. owned by another officer)
  const selectedRouteToAddInfo = React.useMemo(() => {
    if (!selectedRuteToAdd) return null;
    return routes.find((r) => r.kode === selectedRuteToAdd) ?? null;
  }, [routes, selectedRuteToAdd]);

  // Handle Add Route to Selected Petugas
  const handleTambahRute = async () => {
    if (!selectedPetugasId) {
      toast.error('Pilih nama petugas terlebih dahulu di panel kiri');
      return;
    }
    if (!selectedRuteToAdd) {
      toast.error('Pilih kode rute yang ingin ditambahkan');
      return;
    }

    // PENGAMAN ANTI DUPLIKAT: Periksa apakah rute sudah ada di petugas ini
    const isAlreadyAssigned = assignedRoutesForPetugas.some((r) => r.kode === selectedRuteToAdd);
    if (isAlreadyAssigned) {
      toast.error(`Rute ${selectedRuteToAdd} sudah terdaftar pada petugas ini.`);
      return;
    }

    setSavingAssign(true);
    const isSementara = statusSementaraToAdd === 'YA';

    try {
      const json = await masterApi.pemetaan.assignRute(selectedRuteToAdd, selectedPetugasId, isSementara);
      if (json.success) {
        toast.success(
          `Rute ${selectedRuteToAdd} berhasil ditambahkan ke ${activePetugas?.nama || selectedPetugasId}`
        );

        // Update local state smoothly
        const prevOwnerId = selectedRouteToAddInfo?.pencatatDefault;
        setRoutes((prev) =>
          prev.map((r) =>
            r.kode === selectedRuteToAdd
              ? {
                  ...r,
                  pencatatDefault: selectedPetugasId,
                  namaPetugas: activePetugas?.nama ?? selectedPetugasId,
                  statusSementara: isSementara,
                }
              : r
          )
        );

        // Update counts in petugasOptions
        setPetugasOptions((prev) =>
          prev.map((p) => {
            if (p.id === selectedPetugasId) {
              return {
                ...p,
                totalRute: p.totalRute + 1,
                totalSl: p.totalSl + (selectedRouteToAddInfo?.totalPelanggan || 0),
              };
            }
            if (prevOwnerId && p.id === prevOwnerId) {
              return {
                ...p,
                totalRute: Math.max(0, p.totalRute - 1),
                totalSl: Math.max(0, p.totalSl - (selectedRouteToAddInfo?.totalPelanggan || 0)),
              };
            }
            return p;
          })
        );

        setSelectedRuteToAdd('');
      } else {
        toast.error(json.error || 'Gagal menambahkan rute');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat menambahkan rute');
    } finally {
      setSavingAssign(false);
    }
  };

  // Handle Remove Route from Petugas
  const handleHapusRute = async (ruteKode: string) => {
    if (!selectedPetugasId) return;

    setDeletingRuteKode(ruteKode);
    const targetRoute = routes.find((r) => r.kode === ruteKode);

    try {
      const json = await masterApi.pemetaan.assignRute(ruteKode, null, false);
      if (json.success) {
        toast.success(`Rute ${ruteKode} berhasil dilepas dari penugasan`);

        // Update local routes
        setRoutes((prev) =>
          prev.map((r) =>
            r.kode === ruteKode
              ? {
                  ...r,
                  pencatatDefault: null,
                  namaPetugas: null,
                  statusSementara: false,
                }
              : r
          )
        );

        // Update counts in petugasOptions
        setPetugasOptions((prev) =>
          prev.map((p) => {
            if (p.id === selectedPetugasId) {
              return {
                ...p,
                totalRute: Math.max(0, p.totalRute - 1),
                totalSl: Math.max(0, p.totalSl - (targetRoute?.totalPelanggan || 0)),
              };
            }
            return p;
          })
        );
      } else {
        toast.error(json.error || 'Gagal menghapus penugasan rute');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan jaringan saat menghapus rute');
    } finally {
      setDeletingRuteKode(null);
    }
  };

  // Filtered Petugas List for Left Panel Tab 1
  const filteredPetugasList = React.useMemo(() => {
    if (!searchPetugas.trim()) return petugasOptions;
    const q = searchPetugas.toLowerCase().trim();
    return petugasOptions.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [petugasOptions, searchPetugas]);

  // Tab 2: Initialize urutan list when selection changes
  React.useEffect(() => {
    if (activeTab !== 'urutan') return;

    let filtered = routes;
    if (selectedWilayahUrutan !== 'ALL') {
      filtered = filtered.filter((r) => r.seksiKode === selectedWilayahUrutan);
    }
    if (selectedPetugasUrutan) {
      filtered = filtered.filter((r) => r.pencatatDefault === selectedPetugasUrutan);
    }

    // Sort by noUrut ascending
    const sorted = [...filtered].sort((a, b) => a.noUrut - b.noUrut || a.kode.localeCompare(b.kode));
    setUrutanList(sorted);
    setHasUrutanChanges(false);
  }, [activeTab, selectedWilayahUrutan, selectedPetugasUrutan, routes]);

  // Tab 2: Reorder items Up or Down
  const moveUrutanItem = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= urutanList.length) return;

    const newList = [...urutanList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    // Normalisasi nomor urut sekuensial 1..N
    const normalized = newList.map((item, idx) => ({
      ...item,
      noUrut: idx + 1,
    }));

    setUrutanList(normalized);
    setHasUrutanChanges(true);
  };

  // Tab 2: Direct Edit No Urut
  const handleUrutanDirectChange = (kode: string, newNoUrut: number) => {
    const val = Math.max(1, newNoUrut || 1);
    setUrutanList((prev) =>
      prev.map((r) => (r.kode === kode ? { ...r, noUrut: val } : r))
    );
    setHasUrutanChanges(true);
  };

  // Tab 2: Save Sequence Changes
  const handleSimpanUrutan = async () => {
    if (urutanList.length === 0) return;

    setSavingUrutan(true);
    try {
      // Sort and normalize 1..N
      const sorted = [...urutanList].sort((a, b) => a.noUrut - b.noUrut);
      const normalized = sorted.map((item, idx) => ({
        ...item,
        noUrut: idx + 1,
      }));

      const payload = normalized.map((item) => ({
        ruteKode: item.kode,
        noUrut: item.noUrut,
      }));

      const json = await masterApi.pemetaan.updateUrutanRute(payload);

      if (json.success) {
        toast.success(`Berhasil menyimpan urutan untuk ${normalized.length} rute`);
        setUrutanList(normalized);
        setHasUrutanChanges(false);

        // Sync with master routes
        const urutMap = new Map(normalized.map((n) => [n.kode, n.noUrut]));
        setRoutes((prev) =>
          prev.map((r) => (urutMap.has(r.kode) ? { ...r, noUrut: urutMap.get(r.kode)! } : r))
        );
      } else {
        toast.error(json.error || 'Gagal menyimpan nomor urut rute');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem saat menyimpan urutan');
    } finally {
      setSavingUrutan(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] min-h-[640px] max-w-[1720px] mx-auto w-full p-3 sm:p-5 gap-3 overflow-hidden">
      {/* 1. Header & Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-foreground text-background">
              <Route className="size-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Pemetaan dan Urutan Rute Baca
            </h1>
            <Badge variant="outline" className="font-mono text-label-11">
              {routes.length} Total Rute
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Kelola penugasan rute petugas pencatat meter serta sesuaikan nomor urut langkah baca
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="h-8 p-0.5">
              <TabsTrigger value="penugasan" className="h-7 text-label-12 gap-1.5 px-3">
                <Users className="size-3.5" />
                Penugasan Rute
              </TabsTrigger>
              <TabsTrigger value="urutan" className="h-7 text-label-12 gap-1.5 px-3">
                <ListOrdered className="size-3.5" />
                Urutan Rute Baca
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 gap-1.5 text-label-12 font-mono"
            title="Segarkan Data"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-foreground" />
            <span className="text-xs text-muted-foreground font-mono">Memuat pemetaan rute...</span>
          </div>
        </div>
      ) : (
        /* 3. Main Workspace Container */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* ========================================================================= */}
          {/* TAB 1: PENUGASAN RUTE (DUAL PANEL: KIRI PETUGAS, KANAN ATAS-BAWAH)       */}
          {/* ========================================================================= */}
          {activeTab === 'penugasan' && (
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
              {/* PANEL KIRI: DAFTAR NAMA PETUGAS */}
              <div className="col-span-12 md:col-span-4 lg:col-span-4 flex flex-col min-h-0 rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                {/* Header Panel Kiri */}
                <div className="p-3 border-b border-border/60 bg-muted/20 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label-12 font-bold tracking-tight text-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-muted-foreground" />
                      Daftar Petugas Cater
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                      {filteredPetugasList.length} Petugas
                    </Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau kode petugas..."
                      value={searchPetugas}
                      onChange={(e) => setSearchPetugas(e.target.value)}
                      className="h-7 pl-7 text-label-12 font-mono"
                    />
                  </div>
                </div>

                {/* List Petugas dengan Scroll Internal */}
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/40">
                  {filteredPetugasList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                      Petugas tidak ditemukan
                    </div>
                  ) : (
                    filteredPetugasList.map((petugas) => {
                      const isSelected = petugas.id === selectedPetugasId;
                      return (
                        <button
                          key={petugas.id}
                          type="button"
                          onClick={() => setSelectedPetugasId(petugas.id)}
                          className={cn(
                            'w-full text-left p-2.5 sm:p-3 transition-colors flex items-center justify-between group cursor-pointer',
                            isSelected
                              ? 'bg-foreground text-background font-medium'
                              : 'hover:bg-muted/50 text-foreground'
                          )}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span
                              className={cn(
                                'text-label-13 font-semibold truncate',
                                isSelected ? 'text-background' : 'text-foreground'
                              )}
                            >
                              {petugas.nama}
                            </span>
                            <span
                              className={cn(
                                'font-mono text-label-11',
                                isSelected ? 'text-background/80' : 'text-muted-foreground'
                              )}
                            >
                              ID: {petugas.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge
                              variant={isSelected ? 'outline' : 'secondary'}
                              className={cn(
                                'font-mono text-[10px] px-1.5 py-0',
                                isSelected
                                  ? 'border-background/40 text-background bg-background/10'
                                  : 'text-foreground'
                              )}
                            >
                              {petugas.totalRute} Rute
                            </Badge>
                            <Badge
                              variant={isSelected ? 'outline' : 'outline'}
                              className={cn(
                                'font-mono text-[10px] px-1.5 py-0',
                                isSelected
                                  ? 'border-background/40 text-background bg-background/10'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {petugas.totalSl.toLocaleString('id-ID')} SL
                            </Badge>
                            <ChevronRight
                              className={cn(
                                'size-3.5 transition-transform',
                                isSelected
                                  ? 'text-background translate-x-0.5'
                                  : 'text-muted-foreground opacity-50 group-hover:opacity-100'
                              )}
                            />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* PANEL KANAN: TERBAGI 2 ATAS (FORM TAMBAH) & BAWAH (TABEL RUTE) */}
              <div className="col-span-12 md:col-span-8 lg:col-span-8 flex flex-col gap-3 min-h-0 overflow-hidden">
                {/* PANEL ATAS: FORM TAMBAH RUTE */}
                <Card className="p-3 sm:p-3.5 border-border bg-card shadow-2xs shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-label-12 font-bold tracking-tight text-foreground flex items-center gap-1.5">
                        <Plus className="size-3.5 text-foreground" />
                        Tambah Penugasan Rute ke {activePetugas?.nama || 'Petugas'}
                      </span>
                      {activePetugas && (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          ID: {activePetugas.id}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      Pengaman anti duplikat aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    {/* Select Menu 1: Kode Rute (PENGAMAN ANTI DUPLIKAT TERPASANG) */}
                    <div className="sm:col-span-6 flex flex-col gap-1">
                      <label className="text-label-11 font-medium text-muted-foreground">
                        Pilih Kode Rute
                      </label>
                      <Select
                        value={selectedRuteToAdd}
                        onValueChange={setSelectedRuteToAdd}
                        disabled={savingAssign || !selectedPetugasId}
                      >
                        <SelectTrigger className="h-8 text-label-12 font-mono w-full">
                          <SelectValue placeholder="Pilih rute yang ingin ditambahkan..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 font-mono">
                          {availableRoutesToAdd.map((r) => {
                            const isAssignedToOther = Boolean(r.pencatatDefault);
                            return (
                              <SelectItem key={r.kode} value={r.kode} className="text-label-12">
                                <span className="font-bold">{r.kode}</span>
                                <span className="text-muted-foreground ml-1.5">
                                  {r.totalPelanggan} SL
                                </span>
                                {isAssignedToOther ? (
                                  <span className="text-amber-600 dark:text-amber-400 ml-2 text-[11px]">
                                    — Petugas saat ini: {r.namaPetugas || r.pencatatDefault}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 ml-2 text-[11px]">
                                    — Belum Ditugaskan
                                  </span>
                                )}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select Menu 2: Status Sementara (Ya / Tidak) */}
                    <div className="sm:col-span-3 flex flex-col gap-1">
                      <label className="text-label-11 font-medium text-muted-foreground">
                        Status Sementara
                      </label>
                      <Select
                        value={statusSementaraToAdd}
                        onValueChange={setStatusSementaraToAdd}
                        disabled={savingAssign || !selectedPetugasId}
                      >
                        <SelectTrigger className="h-8 text-label-12 font-mono w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="font-mono">
                          <SelectItem value="TIDAK" className="text-label-12">
                            Tidak — Penugasan Tetap
                          </SelectItem>
                          <SelectItem value="YA" className="text-label-12">
                            Ya — Sementara
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Button Tambah */}
                    <div className="sm:col-span-3">
                      <Button
                        onClick={handleTambahRute}
                        disabled={savingAssign || !selectedRuteToAdd || !selectedPetugasId}
                        size="sm"
                        className="h-8 w-full gap-1.5 text-label-12 font-mono"
                      >
                        {savingAssign ? (
                          <Spinner className="size-3.5" />
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                        Tambah
                      </Button>
                    </div>
                  </div>

                  {/* Warning Chip jika rute saat ini dipegang petugas lain */}
                  {selectedRouteToAddInfo?.pencatatDefault && (
                    <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-sans">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span>
                        Peringatan: Rute {selectedRouteToAddInfo.kode} saat ini ditugaskan ke{' '}
                        <strong>
                          {selectedRouteToAddInfo.namaPetugas || selectedRouteToAddInfo.pencatatDefault}
                        </strong>
                        . Menambahkan rute ini akan mengalihkan penugasannya ke{' '}
                        <strong>{activePetugas?.nama}</strong>.
                      </span>
                    </div>
                  )}
                </Card>

                {/* PANEL BAWAH: DAFTAR TABEL KODE RUTE PETUGAS */}
                <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                  {/* Toolbar Tabel */}
                  <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-label-12 font-bold tracking-tight text-foreground flex items-center gap-1.5">
                        <Route className="size-3.5 text-muted-foreground" />
                        Daftar Rute Terdaftar: {activePetugas?.nama || 'Petugas'}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                        {assignedRoutesForPetugas.length} Rute
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                        {assignedRoutesForPetugas
                          .reduce((sum, r) => sum + r.totalPelanggan, 0)
                          .toLocaleString('id-ID')}{' '}
                        Total SL
                      </Badge>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
                      <Input
                        placeholder="Filter rute..."
                        value={searchRutePetugas}
                        onChange={(e) => setSearchRutePetugas(e.target.value)}
                        className="h-7 pl-7 text-label-12 font-mono"
                      />
                    </div>
                  </div>

                  {/* Tabel dengan Scroll Internal (Tinggi Layar Dibatasi) */}
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {filteredAssignedRoutes.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <Route className="size-8 stroke-1 text-muted-foreground/40 mb-2" />
                        <span className="text-copy-13 font-medium text-foreground">
                          Belum ada rute terdaftar
                        </span>
                        <span className="text-label-11 mt-1 max-w-sm">
                          Gunakan panel atas untuk menambahkan rute dan status sementara ke petugas{' '}
                          {activePetugas?.nama}.
                        </span>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                          <TableRow className="h-8">
                            <TableHead className="w-16 text-center font-mono text-label-11">
                              Nomor
                            </TableHead>
                            <TableHead className="font-mono text-label-11">Kode Rute</TableHead>
                            <TableHead className="font-mono text-label-11">Status</TableHead>
                            <TableHead className="font-mono text-label-11 text-right">
                              Jumlah SL
                            </TableHead>
                            <TableHead className="w-24 text-center font-mono text-label-11">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="font-mono">
                          {filteredAssignedRoutes.map((rute, index) => {
                            const isDeleting = deletingRuteKode === rute.kode;
                            return (
                              <TableRow key={rute.kode} className="h-9 hover:bg-muted/40">
                                <TableCell className="text-center text-label-12 text-muted-foreground">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-bold text-label-13 text-foreground">
                                  {rute.kode}
                                  {rute.seksiNama && (
                                    <span className="text-[11px] text-muted-foreground font-normal ml-2 font-sans">
                                      {rute.seksiNama}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {rute.statusSementara ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-sans border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 gap-1 px-1.5 py-0"
                                    >
                                      <Clock className="size-2.5" />
                                      Sementara
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] font-sans px-1.5 py-0"
                                    >
                                      Tetap
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-label-12 font-bold text-foreground">
                                  {rute.totalPelanggan.toLocaleString('id-ID')} SL
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleHapusRute(rute.kode)}
                                    disabled={isDeleting}
                                    className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1 text-label-11"
                                    title={`Hapus rute ${rute.kode} dari penugasan`}
                                  >
                                    {isDeleting ? (
                                      <Spinner className="size-3" />
                                    ) : (
                                      <Trash2 className="size-3.5" />
                                    )}
                                    Hapus
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PENGELOLAAN NOMOR URUT RUTE BACA                                  */}
          {/* ========================================================================= */}
          {activeTab === 'urutan' && (
            <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
              {/* PANEL KIRI: MENU PENCARIAN ATAS (WILAYAH) DAN BAWAH (PETUGAS) */}
              <div className="col-span-12 md:col-span-4 lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
                <Card className="p-3.5 border-border bg-card shadow-2xs flex flex-col gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-border/60">
                    <Filter className="size-3.5 text-muted-foreground" />
                    <span className="text-label-12 font-bold tracking-tight text-foreground">
                      Filter Urutan Rute
                    </span>
                  </div>

                  {/* Menu Pencarian Posisi Atas: Pilih Wilayah */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-11 font-medium text-muted-foreground">
                      Pilih Wilayah
                    </label>
                    <Select
                      value={selectedWilayahUrutan}
                      onValueChange={setSelectedWilayahUrutan}
                    >
                      <SelectTrigger className="h-8 text-label-12 font-mono w-full">
                        <SelectValue placeholder="Pilih wilayah..." />
                      </SelectTrigger>
                      <SelectContent className="font-mono">
                        <SelectItem value="ALL" className="text-label-12">
                          Semua Wilayah
                        </SelectItem>
                        {wilayahOptions.map((w) => (
                          <SelectItem key={w.kode} value={w.kode} className="text-label-12">
                            {w.kode} — {w.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Menu Pencarian Posisi Bawah: Nama Petugas */}
                  <div className="flex flex-col gap-1">
                    <label className="text-label-11 font-medium text-muted-foreground">
                      Nama Petugas
                    </label>
                    <Select
                      value={selectedPetugasUrutan}
                      onValueChange={setSelectedPetugasUrutan}
                    >
                      <SelectTrigger className="h-8 text-label-12 font-mono w-full">
                        <SelectValue placeholder="Pilih nama petugas..." />
                      </SelectTrigger>
                      <SelectContent className="font-mono">
                        {petugasOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-label-12">
                            {p.nama} · ID {p.id} — {p.totalRute} Rute
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* Info Card Panduan Urutan */}
                <Card className="p-3.5 border-border bg-muted/20 shadow-none flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
                  <span className="text-label-12 font-bold text-foreground flex items-center gap-1.5">
                    <ListOrdered className="size-3.5 text-foreground" />
                    Panduan Nomor Urut Rute
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                    Nomor urut menentukan sekuensial rute pembacaan meter petugas di lapangan pada
                    aplikasi mobile cater.
                  </p>
                  <ul className="text-[11px] text-muted-foreground space-y-1 font-sans list-disc pl-4">
                    <li>Gunakan tombol panah Naik dan Turun untuk menggeser nomor urut secara cepat.</li>
                    <li>Atau ketik nomor urut langsung pada kolom No Urut.</li>
                    <li>Sistem otomatis menormalisasi sekuensial 1 sampai N tanpa jeda nomor.</li>
                    <li>Tekan tombol Simpan Urutan untuk memperbarui urutan ke database.</li>
                  </ul>
                </Card>
              </div>

              {/* PANEL KANAN: TABEL DAFTAR RUTE & PENGATURAN URUTAN */}
              <div className="col-span-12 md:col-span-8 lg:col-span-8 flex flex-col min-h-0 rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
                {/* Toolbar Panel Kanan Tab 2 */}
                <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-label-12 font-bold tracking-tight text-foreground flex items-center gap-1.5">
                      <ListOrdered className="size-3.5 text-muted-foreground" />
                      Daftar Urutan Rute Baca
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                      {urutanList.length} Rute
                    </Badge>
                    {hasUrutanChanges && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      >
                        Perubahan Belum Disimpan
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSimpanUrutan}
                      disabled={savingUrutan || !hasUrutanChanges || urutanList.length === 0}
                      size="sm"
                      className="h-8 gap-1.5 text-label-12 font-mono font-semibold"
                    >
                      {savingUrutan ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      Simpan Urutan
                    </Button>
                  </div>
                </div>

                {/* Tabel Urutan dengan Scroll Internal */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {urutanList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <ListOrdered className="size-8 stroke-1 text-muted-foreground/40 mb-2" />
                      <span className="text-copy-13 font-medium text-foreground">
                        Tidak ada rute ditemukan
                      </span>
                      <span className="text-label-11 mt-1 max-w-sm">
                        Sesuaikan pilihan wilayah dan nama petugas pada panel kiri untuk memuat
                        daftar rute yang akan diurutkan.
                      </span>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow className="h-8">
                          <TableHead className="w-16 text-center font-mono text-label-11">
                            No
                          </TableHead>
                          <TableHead className="font-mono text-label-11">Rute</TableHead>
                          <TableHead className="font-mono text-label-11 text-right">
                            Jumlah Pelanggan
                          </TableHead>
                          <TableHead className="w-28 text-center font-mono text-label-11">
                            No Urut
                          </TableHead>
                          <TableHead className="w-32 text-center font-mono text-label-11">
                            Edit
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="font-mono">
                        {urutanList.map((item, idx) => (
                          <TableRow key={item.kode} className="h-9 hover:bg-muted/40">
                            <TableCell className="text-center text-label-12 text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-bold text-label-13 text-foreground">
                              {item.kode}
                              {item.seksiNama && (
                                <span className="text-[11px] text-muted-foreground font-normal ml-2 font-sans">
                                  {item.seksiNama}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-label-12 font-bold text-foreground">
                              {item.totalPelanggan.toLocaleString('id-ID')} SL
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={1}
                                value={item.noUrut}
                                onChange={(e) =>
                                  handleUrutanDirectChange(item.kode, parseInt(e.target.value, 10))
                                }
                                className="h-7 w-16 mx-auto text-center font-mono font-bold text-label-12"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={idx === 0}
                                  onClick={() => moveUrutanItem(idx, 'UP')}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  title="Naikkan Urutan"
                                >
                                  <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={idx === urutanList.length - 1}
                                  onClick={() => moveUrutanItem(idx, 'DOWN')}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  title="Turunkan Urutan"
                                >
                                  <ArrowDown className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
