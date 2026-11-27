'use client';

import * as React from 'react';
import {
  Tag,
  Search,
  RefreshCw,
  Edit2,
  Plus,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const KATEGORI_OPTIONS = [
  { value: 'TERBACA', label: 'Terbaca' },
  { value: 'KENDALA_AKSES', label: 'Kendala Akses' },
  { value: 'KENDALA_TEKNIS', label: 'Kendala Teknis' },
  { value: 'KERUSAKAN_FISIK', label: 'Kerusakan Fisik' },
  { value: 'PELANGGARAN', label: 'Pelanggaran' },
] as const;

const MODE_HITUNG_OPTIONS = [
  {
    value: 'SELISIH_FISIK',
    label: 'Selisih Fisik (ST Akhir − ST Awal)',
    short: 'Selisih Fisik',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'TAKSASI_HISTORI',
    label: 'Taksasi Histori / Pakai Lalu',
    short: 'Taksasi Histori',
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  {
    value: 'NOL',
    label: 'Pemakaian Nol (0 m³)',
    short: 'Nol (0 m³)',
    badge: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  },
  {
    value: 'METER_BARU',
    label: 'Meter Baru (Stand Angkat + Baru)',
    short: 'Meter Baru (MB)',
    badge: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  {
    value: 'MUDA_KEMBALI',
    label: 'Muda Kembali (Rollover 10^D)',
    short: 'Muda Kembali',
    badge: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
  {
    value: 'KREDIT_TAKSASI',
    label: 'Kredit Taksasi (Rekonsiliasi Kelebihan)',
    short: 'Kredit Taksasi',
    badge: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
] as const;

const MODE_MAP = new Map<string, (typeof MODE_HITUNG_OPTIONS)[number]>(
  MODE_HITUNG_OPTIONS.map((m) => [m.value, m]),
);

const KATEGORI_BADGE: Record<string, string> = {
  TERBACA:
    'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  KENDALA_AKSES:
    'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  KENDALA_TEKNIS:
    'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  KERUSAKAN_FISIK:
    'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  PELANGGARAN:
    'border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300',
};

export function KelolaKodeKelainan() {
  const [items, setItems] = React.useState<KelainanMasterItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filterKategori, setFilterKategori] = React.useState<string>('ALL');

  // State Dialog Form (Tambah & Ubah)
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [modeForm, setModeForm] = React.useState<'CREATE' | 'EDIT'>('EDIT');
  const [formKode, setFormKode] = React.useState('');
  const [formNama, setFormNama] = React.useState('');
  const [formKategori, setFormKategori] = React.useState('KENDALA_AKSES');
  const [formModeHitung, setFormModeHitung] = React.useState('TAKSASI_HISTORI');
  const [formDeskripsi, setFormDeskripsi] = React.useState('');
  const [formAktif, setFormAktif] = React.useState(true);
  const [formAkses, setFormAkses] = React.useState(false);
  const [formMandiri, setFormMandiri] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await masterApi.kelainan.getAll();
      setItems(list);
    } catch (err) {
      console.error('Failed to load kelainan master:', err);
      toast.error('Gagal memuat kamus kode kelainan.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bukaModalTambah = () => {
    setModeForm('CREATE');
    setFormKode('');
    setFormNama('');
    setFormKategori('KENDALA_AKSES');
    setFormModeHitung('TAKSASI_HISTORI');
    setFormDeskripsi('');
    setFormAktif(true);
    setFormAkses(true);
    setFormMandiri(true);
    setDialogOpen(true);
  };

  const bukaModalEdit = (item: KelainanMasterItem) => {
    setModeForm('EDIT');
    setFormKode(item.kodeTmss);
    setFormNama(item.nama);
    setFormKategori(item.kategori || 'TERBACA');
    setFormModeHitung(item.modeHitung || 'SELISIH_FISIK');
    setFormDeskripsi(item.deskripsi || '');
    setFormAktif(item.aktif);
    setFormAkses(item.isKendalaAkses);
    setFormMandiri(item.triggerBacaMandiri);
    setDialogOpen(true);
  };

  const simpanKelainan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKode = formKode.trim().toUpperCase();
    const cleanNama = formNama.trim();
    if (!cleanKode || !cleanNama) {
      toast.error('Kode STI dan Nama Kondisi wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      if (modeForm === 'CREATE') {
        await masterApi.kelainan.create({
          kodeTmss: cleanKode,
          nama: cleanNama,
          kategori: formKategori,
          modeHitung: formModeHitung,
          deskripsi: formDeskripsi.trim() || null,
          aktif: formAktif,
          isKendalaAkses: formAkses,
          triggerBacaMandiri: formMandiri,
        });
        toast.success(`Kode kelainan [${cleanKode}] ${cleanNama} berhasil ditambahkan.`);
      } else {
        await masterApi.kelainan.update(formKode, {
          nama: cleanNama,
          kategori: formKategori,
          modeHitung: formModeHitung,
          deskripsi: formDeskripsi.trim() || null,
          aktif: formAktif,
          isKendalaAkses: formAkses,
          triggerBacaMandiri: formMandiri,
        });
        toast.success(`Kode kelainan [${formKode}] berhasil diperbarui.`);
      }
      setDialogOpen(false);
      void fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal menyimpan kode kelainan.',
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.kodeTmss.toLowerCase().includes(q) ||
        item.nama.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q));

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
              Master Kode Kelainan &amp; Kondisi Catat Meter
            </h1>
            <Badge variant="outline" className="font-mono text-label-11">
              {items.length} Kode Resmi
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-sans">
            Kamus terpusat kode kondisi catat STI, alasan operasional lapangan, mode hitung kubikasi, dan sinkronisasi otomatis ke Engine Anomali.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 gap-1.5 text-label-12 cursor-pointer"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>
          <Button
            size="sm"
            onClick={bukaModalTambah}
            className="h-8 gap-1.5 text-label-12 cursor-pointer"
          >
            <Plus className="size-3.5" />
            Tambah Kode Kelainan
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit overflow-x-auto">
          {(
            [
              { id: 'ALL', label: `Semua (${items.length})` },
              { id: 'TERBACA', label: 'Terbaca' },
              { id: 'KENDALA_AKSES', label: 'Kendala Akses' },
              { id: 'KENDALA_TEKNIS', label: 'Kendala Teknis' },
              { id: 'KERUSAKAN_FISIK', label: 'Kerusakan Fisik' },
              { id: 'PELANGGARAN', label: 'Pelanggaran' },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              variant={filterKategori === tab.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterKategori(tab.id)}
              className="h-7 text-label-11 px-2.5 cursor-pointer"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari kode, nama kelainan, atau alasan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-label-12 bg-card"
          />
        </div>
      </div>

      {/* 3. Table Area */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-foreground" />
            <span className="text-xs text-muted-foreground font-mono">
              Memuat kamus kode kelainan...
            </span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center border-dashed border-border text-muted-foreground text-copy-13">
          Tidak ada kode kelainan yang cocok dengan pencarian Anda.
        </Card>
      ) : (
        <Card className="border-border bg-card shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
          <Table containerClassName="h-full overflow-auto">
            <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-xs [&_th]:sticky [&_th]:top-0 [&_th]:bg-muted/95 [&_th]:backdrop-blur-xs [&_th]:z-20">
              <TableRow className="h-9">
                <TableHead className="w-20 text-center font-mono text-label-11">
                  Kode STI
                </TableHead>
                <TableHead className="font-mono text-label-11">
                  Nama Kondisi / Kelainan
                </TableHead>
                <TableHead className="font-mono text-label-11">Kategori</TableHead>
                <TableHead className="font-mono text-label-11">
                  Mode Hitung
                </TableHead>
                <TableHead className="text-center font-mono text-label-11">
                  Kendala Akses
                </TableHead>
                <TableHead className="text-center font-mono text-label-11">
                  Baca Mandiri
                </TableHead>
                <TableHead className="font-mono text-label-11">
                  Alasan / Deskripsi Operasional
                </TableHead>
                <TableHead className="text-center font-mono text-label-11">
                  Status
                </TableHead>
                <TableHead className="text-right font-mono text-label-11">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const modeInfo = MODE_MAP.get(item.modeHitung);
                return (
                  <TableRow key={item.kodeTmss} className="h-10 hover:bg-muted/40">
                    <TableCell className="text-center font-mono font-bold text-label-13 text-foreground">
                      <span className="inline-flex min-w-7 items-center justify-center rounded border border-border bg-muted/60 px-1.5 py-0.5">
                        {item.kodeTmss}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground text-label-13">
                      {item.nama}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10.5px] font-mono px-1.5 py-0',
                          KATEGORI_BADGE[item.kategori] ?? '',
                        )}
                      >
                        {item.kategori}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10.5px] font-medium px-1.5 py-0 gap-1',
                          modeInfo?.badge ?? '',
                        )}
                      >
                        <Calculator className="size-2.5" />
                        {modeInfo?.short ?? item.modeHitung}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isKendalaAkses ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 px-1.5 py-0"
                        >
                          Ya
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.triggerBacaMandiri ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 px-1.5 py-0"
                        >
                          Aktif
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-label-12 max-w-sm truncate">
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
                        className="h-7 text-label-11 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit2 className="size-3" />
                        Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 4. Dialog Tambah / Ubah Kode Kelainan */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {modeForm === 'CREATE'
                ? 'Tambah Kode Kelainan & Kondisi Baru'
                : `Ubah Kode Kelainan: [${formKode}]`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Atur penamaan resmi, kategori anomali, rumus mode hitung pemakaian, dan keterangan alasan operasional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={simpanKelainan} className="space-y-4 text-xs pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kode STI / TMSS
                </label>
                <Input
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                  disabled={modeForm === 'EDIT'}
                  maxLength={10}
                  placeholder="Mis: V, W, AB"
                  required
                  className="font-mono uppercase text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-foreground block mb-1">
                  Nama Kondisi / Kelainan Resmi
                </label>
                <Input
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Mis: RMH/TANAH KSG, METER MATI AIR ADA"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kategori Evaluasi Anomali
                </label>
                <Select
                  value={formKategori}
                  onValueChange={(val) => {
                    setFormKategori(val);
                    if (val === 'KENDALA_AKSES') {
                      setFormAkses(true);
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Rumus Mode Hitung Kubikasi
                </label>
                <Select value={formModeHitung} onValueChange={setFormModeHitung}>
                  <SelectTrigger size="sm" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_HITUNG_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                Alasan Operasional / Deskripsi Petunjuk
              </label>
              <Textarea
                value={formDeskripsi}
                onChange={(e) => setFormDeskripsi(e.target.value)}
                rows={3}
                placeholder="Jelaskan arti kode kelainan dan tindak lanjut verifikasi/lapangan..."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={formAkses}
                  onCheckedChange={(c) => setFormAkses(Boolean(c))}
                />
                <span className="font-medium text-foreground">
                  Kendala Akses
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={formMandiri}
                  onCheckedChange={(c) => setFormMandiri(Boolean(c))}
                />
                <span className="font-medium text-foreground">
                  Pemicu Baca Mandiri
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={formAktif}
                  onCheckedChange={(c) => setFormAktif(Boolean(c))}
                />
                <span className="font-medium text-foreground">
                  Status Kode Aktif
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {saving && <Spinner className="size-3" />}
                {modeForm === 'CREATE' ? 'Tambah Kode' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
