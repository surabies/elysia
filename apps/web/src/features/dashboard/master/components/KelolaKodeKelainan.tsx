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
import { masterApi } from '../api';
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
      const items = await masterApi.kelainan.getAll();
      setItems(items);
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
      await masterApi.kelainan.update(editItem.kodeTmss, {
        nama: editNama,
        deskripsi: editDeskripsi,
        aktif: editAktif,
        isKendalaAkses: editAkses,
        triggerBacaMandiri: editMandiri,
      });
      setEditItem(null);
      fetchData();
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
    <div className="flex flex-col h-[calc(100vh-4.5rem)] min-h-[640px] max-w-[1720px] mx-auto w-full p-3 sm:p-5 gap-3 overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-foreground text-background">
              <Tag className="size-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-sans">
              Master Kode Kelainan Fisik Water Meter
            </h1>
            <Badge variant="outline" className="font-mono text-label-11">
              {items.length} Kode Kelainan
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Kamus kode kondisi catat STI, kendala akses fisik, kerusakan meter, dan pemicu lapor mandiri
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="h-8 gap-1.5 text-label-12 font-mono shrink-0"
          title="Segarkan Data"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Segarkan
        </Button>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit overflow-x-auto">
          <Button
            variant={filterKategori === 'ALL' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('ALL')}
            className="h-7 text-label-11 px-2.5"
          >
            Semua ({items.length})
          </Button>
          <Button
            variant={filterKategori === 'TERBACA' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('TERBACA')}
            className="h-7 text-label-11 px-2.5"
          >
            Terbaca
          </Button>
          <Button
            variant={filterKategori === 'KENDALA_AKSES' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('KENDALA_AKSES')}
            className="h-7 text-label-11 px-2.5"
          >
            Kendala Akses
          </Button>
          <Button
            variant={filterKategori === 'KERUSAKAN_FISIK' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('KERUSAKAN_FISIK')}
            className="h-7 text-label-11 px-2.5"
          >
            Kerusakan Fisik
          </Button>
          <Button
            variant={filterKategori === 'PELANGGARAN' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterKategori('PELANGGARAN')}
            className="h-7 text-label-11 px-2.5"
          >
            Pelanggaran
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 size-3 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama kelainan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-label-12 font-mono"
          />
        </div>
      </div>

      {/* 3. Table Area */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-foreground" />
            <span className="text-xs text-muted-foreground font-mono">Memuat kode kelainan...</span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center border-dashed border-border text-muted-foreground text-copy-13">
          Tidak ada kode kelainan yang cocok.
        </Card>
      ) : (
        <Card className="border-border bg-card shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
          <Table containerClassName="h-full overflow-auto">
            <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs [&_th]:sticky [&_th]:top-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-xs [&_th]:z-20">
              <TableRow className="h-8">
                <TableHead className="w-24 text-center font-mono text-label-11">Kode STI</TableHead>
                <TableHead className="font-mono text-label-11">Nama Kondisi / Kelainan</TableHead>
                <TableHead className="font-mono text-label-11">Kategori</TableHead>
                <TableHead className="text-center font-mono text-label-11">Kendala Akses?</TableHead>
                <TableHead className="text-center font-mono text-label-11">Pemicu Mandiri?</TableHead>
                <TableHead className="font-mono text-label-11">Deskripsi Penjelasan</TableHead>
                <TableHead className="text-center font-mono text-label-11">Status</TableHead>
                <TableHead className="text-right font-mono text-label-11">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.kodeTmss} className="h-9 hover:bg-muted/40">
                  <TableCell className="text-center font-mono font-bold text-label-13 text-foreground">
                    {item.kodeTmss}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground text-label-13">
                    {item.nama}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                      {item.kategori}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.isKendalaAkses ? (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 px-1.5 py-0">
                        Ya
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.triggerBacaMandiri ? (
                      <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 px-1.5 py-0">
                        Aktif
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-label-12 max-w-xs truncate">
                    {item.deskripsi || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.aktif ? 'secondary' : 'outline'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => bukaModalEdit(item)}
                      className="h-7 text-label-11 gap-1 text-muted-foreground hover:text-foreground"
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
