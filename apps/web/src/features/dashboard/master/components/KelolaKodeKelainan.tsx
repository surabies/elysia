'use client';

import * as React from 'react';
import {
  Tag,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { KelainanMasterItem } from '@/server/services/master/master-extended.service';

export function KelolaKodeKelainan() {
  const [items, setItems] = React.useState<KelainanMasterItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filterKategori, setFilterKategori] = React.useState<string>('ALL');

  const [editItem, setEditItem] = React.useState<KelainanMasterItem | null>(null);
  const [editNama, setEditNama] = React.useState('');
  const [editDeskripsi, setEditDeskripsi] = React.useState('');
  const [editAktif, setEditAktif] = React.useState(true);
  const [editAkses, setEditAkses] = React.useState(false);
  const [editMandiri, setEditMandiri] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/kelainan');
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data);
      }
    } catch (err) {
      console.error('Failed to load kelainan master:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bukaModalEdit = (item: KelainanMasterItem) => {
    setEditItem(item);
    setEditNama(item.nama);
    setEditDeskripsi(item.deskripsi || '');
    setEditAktif(item.aktif);
    setEditAkses(item.isKendalaAkses);
    setEditMandiri(item.triggerBacaMandiri);
  };

  const simpanKelainan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/master/kelainan/${editItem.kodeTmss}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: editNama,
          deskripsi: editDeskripsi,
          aktif: editAktif,
          isKendalaAkses: editAkses,
          triggerBacaMandiri: editMandiri,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditItem(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update kelainan:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.kodeTmss.toLowerCase().includes(search.toLowerCase()) ||
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase()));

      const matchKategori =
        filterKategori === 'ALL' || item.kategori === filterKategori;

      return matchSearch && matchKategori;
    });
  }, [items, search, filterKategori]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Tag className="size-6 text-primary" />
            Master Kode Kelainan Fisik Water Meter
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kamus 17 kode kondisi catat STI, kendala akses fisik, kerusakan meter, dan pemicu lapor mandiri.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="h-8 gap-1.5 text-xs w-fit"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Segarkan
        </Button>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/40 border border-border w-fit">
          <Button
            variant={filterKategori === 'ALL' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('ALL')}
            className="h-7 text-xs"
          >
            Semua ({items.length})
          </Button>
          <Button
            variant={filterKategori === 'TERBACA' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('TERBACA')}
            className="h-7 text-xs"
          >
            Terbaca
          </Button>
          <Button
            variant={filterKategori === 'KENDALA_AKSES' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('KENDALA_AKSES')}
            className="h-7 text-xs"
          >
            Kendala Akses
          </Button>
          <Button
            variant={filterKategori === 'KERUSAKAN_FISIK' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('KERUSAKAN_FISIK')}
            className="h-7 text-xs"
          >
            Kerusakan Fisik
          </Button>
          <Button
            variant={filterKategori === 'PELANGGARAN' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('PELANGGARAN')}
            className="h-7 text-xs"
          >
            Pelanggaran
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama kelainan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* 3. Table Area */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border text-muted-foreground text-copy-13">
          Tidak ada kode kelainan yang cocok.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-20 text-center">Kode STI</TableHead>
                <TableHead>Nama Kondisi / Kelainan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Kendala Akses?</TableHead>
                <TableHead className="text-center">Pemicu Mandiri?</TableHead>
                <TableHead>Deskripsi Penjelasan</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.kodeTmss}>
                  <TableCell className="text-center font-mono font-bold text-sm text-primary">
                    {item.kodeTmss}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {item.nama}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {item.kategori}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.isKendalaAkses ? (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Ya
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.triggerBacaMandiri ? (
                      <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 border-teal-500/30">
                        Aktif
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                    {item.deskripsi || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.aktif ? 'secondary' : 'outline'}
                      className="text-[10px]"
                    >
                      {item.aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => bukaModalEdit(item)}
                      className="h-7 text-xs gap-1"
                    >
                      <Edit2 className="size-3" />
                      Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 4. Edit Dialog */}
      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        {editItem && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Ubah Kode Kelainan: [{editItem.kodeTmss}]
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Penyesuaian nama, kategori perilaku sistem, dan pemicu alur baca mandiri.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={simpanKelainan} className="space-y-4 text-xs pt-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Nama Kondisi Catat
                </label>
                <Input
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Deskripsi / Petunjuk Petugas
                </label>
                <Textarea
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="editAkses"
                    checked={editAkses}
                    onCheckedChange={(c) => setEditAkses(Boolean(c))}
                  />
                  <label htmlFor="editAkses" className="font-medium text-foreground cursor-pointer select-none">
                    Tandai sebagai Kendala Akses Lapangan
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="editMandiri"
                    checked={editMandiri}
                    onCheckedChange={(c) => setEditMandiri(Boolean(c))}
                  />
                  <label htmlFor="editMandiri" className="font-medium text-foreground cursor-pointer select-none">
                    Picu Notifikasi Lapor Mandiri ke Warga
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="editAktif"
                    checked={editAktif}
                    onCheckedChange={(c) => setEditAktif(Boolean(c))}
                  />
                  <label htmlFor="editAktif" className="font-medium text-foreground cursor-pointer select-none">
                    Status Kode Aktif Dipakai
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditItem(null)}
                  disabled={saving}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {saving && <Spinner className="size-3" />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
