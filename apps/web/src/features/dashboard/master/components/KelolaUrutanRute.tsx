'use client';

import * as React from 'react';
import {
  ListOrdered,
  Search,
  RefreshCw,
  Save,
  ArrowUp,
  ArrowDown,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
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
import type { PelangganUrutanItem } from '@/server/services/master/master-extended.service';

export function KelolaUrutanRute() {
  const [ruteList, setRuteList] = React.useState<{ kode: string; seksiNama: string | null }[]>([]);
  const [selectedRute, setSelectedRute] = React.useState('CD104');
  const [items, setItems] = React.useState<PelangganUrutanItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Ambil daftar rute untuk dropdown
  React.useEffect(() => {
    fetch('/api/master/pemetaan-petugas')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.rute) {
          setRuteList(json.data.rute);
          if (json.data.rute.length > 0) {
            setSelectedRute(json.data.rute[0].kode);
          }
        }
      })
      .catch((err) => console.error('Failed to load rute list:', err));
  }, []);

  // 2. Ambil data urutan pelanggan untuk rute terpilih
  const fetchUrutan = React.useCallback(async (ruteKode: string) => {
    setLoading(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/master/urut?ruteKode=${ruteKode}`);
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items);
      }
    } catch (err) {
      console.error('Failed to load urutan rute:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedRute) {
      fetchUrutan(selectedRute);
    }
  }, [selectedRute, fetchUrutan]);

  // Handle reorder up/down
  const moveItem = (index: number, direction: 'UP' | 'DOWN') => {
    const newItems = [...items];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Re-index urutan sequential 1..N
    newItems.forEach((item, idx) => {
      item.urutan = idx + 1;
    });

    setItems(newItems);
  };

  const handleUrutanChange = (nolg: string, val: number) => {
    setItems((prev) =>
      prev.map((i) => (i.nolg === nolg ? { ...i, urutan: Math.max(1, val) } : i))
    );
  };

  const simpanUrutan = async () => {
    setSaving(true);
    setNotification(null);
    try {
      // Sort before saving
      const sorted = [...items].sort((a, b) => a.urutan - b.urutan);
      sorted.forEach((item, idx) => {
        item.urutan = idx + 1;
      });

      const res = await fetch('/api/master/urut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruteKode: selectedRute,
          periode: '202601',
          items: sorted.map((i) => ({ nolg: i.nolg, urutan: i.urutan })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotification({
          type: 'success',
          message: `Berhasil menyimpan urutan langkah jalan untuk ${json.data.totalUpdated} pelanggan di Rute ${selectedRute}.`,
        });
        setItems(sorted);
      } else {
        setNotification({
          type: 'error',
          message: json.error || 'Gagal menyimpan urutan.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.nolg.toLowerCase().includes(q) ||
        i.nama.toLowerCase().includes(q) ||
        (i.alamat && i.alamat.toLowerCase().includes(q)) ||
        (i.noMeter && i.noMeter.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ListOrdered className="size-6 text-primary" />
            Pengaturan Urutan Langkah Jalan (DPM Rute)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Atur sekuensial langkah fisik pembacaan meter pelanggan di setiap gang / jalan agar rute petugas efisien.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs">
            <span className="text-muted-foreground font-medium">Pilih Rute:</span>
            <NativeSelect
              value={selectedRute}
              onChange={(e) => setSelectedRute(e.target.value)}
              size="xs"
              className="border-none shadow-none font-mono font-bold text-foreground focus-visible:ring-0 p-0 pr-6"
            >
              {ruteList.map((r) => (
                <NativeSelectOption key={r.kode} value={r.kode}>
                  {r.kode} {r.seksiNama ? `(${r.seksiNama})` : ''}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUrutan(selectedRute)}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>

          <Button
            size="sm"
            onClick={simpanUrutan}
            disabled={loading || saving || items.length === 0}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            {saving ? <Spinner className="size-3.5" /> : <Save className="size-3.5" />}
            Simpan Urutan
          </Button>
        </div>
      </div>

      {/* 2. Notification Alert */}
      {notification && (
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-lg border text-copy-13',
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Search Bar & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            Rute: {selectedRute}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Total {items.length} Pelanggan terdaftar
          </span>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari NOLG, nama, alamat, no. meter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* 4. Table Area */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border text-muted-foreground text-copy-13">
          Tidak ada pelanggan yang ditemukan pada rute ini.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-20 text-center">Urutan</TableHead>
                <TableHead className="w-16 text-center">Atur</TableHead>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Alamat Rumah</TableHead>
                <TableHead>Tarif</TableHead>
                <TableHead className="font-mono">No. Water Meter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono">
              {filteredItems.map((item, idx) => (
                <TableRow key={item.nolg}>
                  <TableCell className="text-center font-bold">
                    <Input
                      type="number"
                      value={item.urutan}
                      onChange={(e) => handleUrutanChange(item.nolg, Number(e.target.value))}
                      className="h-7 w-16 text-center font-mono font-bold text-xs mx-auto"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, 'UP')}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        title="Naikkan Urutan"
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === filteredItems.length - 1}
                        onClick={() => moveItem(idx, 'DOWN')}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        title="Turunkan Urutan"
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground font-sans">
                    {item.nolg}
                  </TableCell>
                  <TableCell className="font-sans font-medium text-foreground max-w-[180px] truncate">
                    {item.nama}
                  </TableCell>
                  <TableCell className="font-sans text-muted-foreground text-label-11 max-w-[240px] truncate">
                    {item.alamat || '-'}
                  </TableCell>
                  <TableCell className="font-sans">
                    <Badge variant="outline" className="text-[10px]">
                      {item.tarifKode || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.noMeter || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
