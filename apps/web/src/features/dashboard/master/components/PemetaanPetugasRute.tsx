'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Route,
  Users,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
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

export interface RuteMappingItem {
  kode: string;
  seksiKode: string | null;
  seksiNama: string | null;
  pencatatDefault: string | null;
  namaPetugas: string | null;
  totalPelanggan: number;
}

export function PemetaanPetugasRute() {
  const [routes, setRoutes] = React.useState<RuteMappingItem[]>([]);
  const [petugasOptions, setPetugasOptions] = React.useState<{ id: string; nama: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedPetugasFilter, setSelectedPetugasFilter] = React.useState<string>('ALL');
  const [selectedRoutes, setSelectedRoutes] = React.useState<string[]>([]);
  const [bulkPetugasTarget, setBulkPetugasTarget] = React.useState<string>('');
  const [savingBulk, setSavingBulk] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/pemetaan-petugas');
      const json = await res.json();
      if (json.success && json.data) {
        setRoutes(json.data.rute);
        setPetugasOptions(json.data.petugasOptions);
      }
    } catch (err) {
      console.error('Failed to load rute mapping:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignSingle = async (ruteKode: string, petugasId: string | null) => {
    try {
      const res = await fetch('/api/master/pemetaan-petugas/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruteKode, petugasId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Rute ${ruteKode} berhasil dialihkan`);
        setRoutes((prev) =>
          prev.map((r) =>
            r.kode === ruteKode
              ? {
                  ...r,
                  pencatatDefault: petugasId,
                  namaPetugas: petugasId
                    ? petugasOptions.find((p) => p.id === petugasId)?.nama ?? petugasId
                    : null,
                }
              : r
          )
        );
      } else {
        toast.error(json.error || 'Gagal mengubah penugasan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan jaringan');
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedRoutes.length) {
      toast.error('Pilih minimal satu rute untuk dialihkan');
      return;
    }
    if (!bulkPetugasTarget) {
      toast.error('Pilih petugas tujuan');
      return;
    }

    setSavingBulk(true);
    try {
      const res = await fetch('/api/master/pemetaan-petugas/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruteKodes: selectedRoutes,
          petugasId: bulkPetugasTarget === 'UNASSIGN' ? null : bulkPetugasTarget,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${selectedRoutes.length} rute berhasil dialihkan`);
        setSelectedRoutes([]);
        fetchData();
      } else {
        toast.error(json.error || 'Gagal batch assign');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setSavingBulk(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRoutes.length === filteredRoutes.length) {
      setSelectedRoutes([]);
    } else {
      setSelectedRoutes(filteredRoutes.map((r) => r.kode));
    }
  };

  const toggleSelectRoute = (kode: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]
    );
  };

  const filteredRoutes = React.useMemo(() => {
    return routes.filter((r) => {
      const matchSearch =
        !search.trim() ||
        r.kode.toLowerCase().includes(search.toLowerCase()) ||
        (r.seksiNama && r.seksiNama.toLowerCase().includes(search.toLowerCase())) ||
        (r.namaPetugas && r.namaPetugas.toLowerCase().includes(search.toLowerCase()));

      const matchPetugas =
        selectedPetugasFilter === 'ALL'
          ? true
          : selectedPetugasFilter === 'UNASSIGNED'
          ? !r.pencatatDefault
          : r.pencatatDefault === selectedPetugasFilter;

      return matchSearch && matchPetugas;
    });
  }, [routes, search, selectedPetugasFilter]);

  const totalRute = routes.length;
  const unassignedCount = routes.filter((r) => !r.pencatatDefault).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Pemetaan Penugasan Rute Petugas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribusi 126 rute sekuensial pelanggan ke masing-masing petugas cater lapangan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>

          <Link
            href="/master/petugas"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border bg-card text-xs font-semibold hover:bg-muted transition-colors text-foreground"
          >
            <Users className="h-3.5 w-3.5" />
            Kelola Petugas
          </Link>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode rute atau wilayah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Filter Petugas:</span>
            <NativeSelect
              value={selectedPetugasFilter}
              onChange={(e) => setSelectedPetugasFilter(e.target.value)}
              size="sm"
              className="text-xs font-semibold text-foreground"
            >
              <NativeSelectOption value="ALL">Semua Petugas ({totalRute} Rute)</NativeSelectOption>
              <NativeSelectOption value="UNASSIGNED">Belum Ditugaskan ({unassignedCount})</NativeSelectOption>
              {petugasOptions.map((p) => (
                <NativeSelectOption key={p.id} value={p.id}>
                  {p.nama}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Batch Re-assignment Controls */}
        <div className="flex items-center gap-2">
          {selectedRoutes.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-xs text-primary font-bold">
                {selectedRoutes.length} Rute Terpilih
              </span>
              <NativeSelect
                value={bulkPetugasTarget}
                onChange={(e) => setBulkPetugasTarget(e.target.value)}
                size="sm"
                className="text-xs font-semibold text-foreground"
              >
                <NativeSelectOption value="">Pilih Petugas Tujuan...</NativeSelectOption>
                {petugasOptions.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    Alihkan ke {p.nama}
                  </NativeSelectOption>
                ))}
                <NativeSelectOption value="UNASSIGN">Kosongkan Penugasan</NativeSelectOption>
              </NativeSelect>
              <Button
                size="sm"
                onClick={handleBulkAssign}
                disabled={savingBulk || !bulkPetugasTarget}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                {savingBulk && <Spinner className="h-3 w-3" />}
                Terapkan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Routes Table using shadcn Table */}
      <Card className="border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10 text-center">
                <Checkbox
                  checked={
                    filteredRoutes.length > 0 &&
                    selectedRoutes.length === filteredRoutes.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua rute"
                />
              </TableHead>
              <TableHead>Kode Rute</TableHead>
              <TableHead>Seksi / Wilayah Cater</TableHead>
              <TableHead className="text-right">Beban Pelanggan</TableHead>
              <TableHead>Petugas Bertanggung Jawab</TableHead>
              <TableHead className="text-right">Aksi Alihkan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoutes.map((rute) => {
              const isSelected = selectedRoutes.includes(rute.kode);
              return (
                <TableRow
                  key={rute.kode}
                  className={cn(isSelected && 'bg-primary/5')}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectRoute(rute.kode)}
                      aria-label={`Pilih ${rute.kode}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-bold text-foreground">
                    {rute.kode}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rute.seksiNama || rute.seksiKode || 'WIL-PUSAT'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {rute.totalPelanggan.toLocaleString('id-ID')} SL
                  </TableCell>
                  <TableCell>
                    {rute.pencatatDefault ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs">
                        <Users className="h-3 w-3" />
                        <span>{rute.namaPetugas ?? rute.pencatatDefault}</span>
                      </div>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        Belum Ditugaskan
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <NativeSelect
                      value={rute.pencatatDefault ?? ''}
                      onChange={(e) =>
                        handleAssignSingle(rute.kode, e.target.value || null)
                      }
                      size="xs"
                      className="text-xs font-medium text-foreground ml-auto"
                    >
                      <NativeSelectOption value="">-- Pilih Petugas --</NativeSelectOption>
                      {petugasOptions.map((p) => (
                        <NativeSelectOption key={p.id} value={p.id}>
                          {p.nama}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
