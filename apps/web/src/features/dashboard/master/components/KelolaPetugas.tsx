'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  Phone,
  Route,
  Search,
  Plus,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';

export interface PetugasMasterItem {
  id: string;
  nama: string;
  noHp: string | null;
  aktif: boolean;
  totalRute: number;
  totalPelanggan: number;
  ruteList: string[];
  createdAt: string;
}

export function KelolaPetugas() {
  const [data, setData] = React.useState<PetugasMasterItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [modalPetugas, setModalPetugas] = React.useState<{
    mode: 'tambah' | 'edit';
    item?: PetugasMasterItem;
  } | null>(null);

  // Form states
  const [formId, setFormId] = React.useState('');
  const [formNama, setFormNama] = React.useState('');
  const [formNoHp, setFormNoHp] = React.useState('');
  const [formAktif, setFormAktif] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/petugas');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load petugas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bukaModalTambah = () => {
    setFormId('');
    setFormNama('');
    setFormNoHp('');
    setFormAktif(true);
    setModalPetugas({ mode: 'tambah' });
  };

  const bukaModalEdit = (item: PetugasMasterItem) => {
    setFormId(item.id);
    setFormNama(item.nama);
    setFormNoHp(item.noHp || '');
    setFormAktif(item.aktif);
    setModalPetugas({ mode: 'edit', item });
  };

  const simpanPetugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    setSaving(true);
    try {
      if (modalPetugas?.mode === 'tambah') {
        const res = await fetch('/api/master/petugas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: formId.trim().toUpperCase(),
            nama: formNama.trim(),
            noHp: formNoHp.trim() || undefined,
            aktif: formAktif,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Petugas baru berhasil ditambahkan');
          setModalPetugas(null);
          fetchData();
        } else {
          toast.error(json.error || 'Gagal menambah petugas');
        }
      } else if (modalPetugas?.mode === 'edit' && modalPetugas.item) {
        const res = await fetch(`/api/master/petugas/${modalPetugas.item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: formNama.trim(),
            noHp: formNoHp.trim() || undefined,
            aktif: formAktif,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success('Data petugas berhasil diperbarui');
          setModalPetugas(null);
          fetchData();
        } else {
          toast.error(json.error || 'Gagal update petugas');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.noHp && p.noHp.includes(q))
    );
  }, [data, search]);

  const totalPetugas = data.length;
  const aktifCount = data.filter((p) => p.aktif).length;
  const totalRute = data.reduce((acc, p) => acc + p.totalRute, 0);
  const totalPelanggan = data.reduce((acc, p) => acc + p.totalPelanggan, 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Kelola Master Petugas Cater
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manajemen profil, status aktif, dan nomor kontak petugas pencatat meter lapangan
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

          <Button
            size="sm"
            onClick={bukaModalTambah}
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Petugas
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Petugas</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            {totalPetugas}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Petugas terdaftar di sistem</p>
        </Card>

        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Status Aktif</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600">
            {aktifCount} / {totalPetugas}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Siap bertugas di lapangan</p>
        </Card>

        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Rute Terdistribusi</span>
            <Route className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600">
            {totalRute}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Rute terpetakan ke petugas</p>
        </Card>

        <Card className="p-4 border bg-card/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Beban Pelanggan</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600">
            {totalPelanggan.toLocaleString('id-ID')}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Pelanggan aktif dalam rute</p>
        </Card>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari nama atau NIP petugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>

          <Link
            href="/master/pemetaan-petugas"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            Buka Pemetaan Rute &rarr;
          </Link>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>ID / NIP</TableHead>
                <TableHead>Nama Petugas</TableHead>
                <TableHead>No. Kontak / HP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Rute Diampu</TableHead>
                <TableHead className="text-right">Beban Pelanggan</TableHead>
                <TableHead>Daftar Rute</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((petugas) => (
                <TableRow key={petugas.id}>
                  <TableCell className="font-mono font-bold text-foreground">
                    {petugas.id}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {petugas.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{petugas.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {petugas.noHp ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {petugas.noHp}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={petugas.aktif ? 'outline' : 'secondary'}
                      className={cn(
                        'text-[10px]',
                        petugas.aktif
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {petugas.aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-blue-600">
                    {petugas.totalRute}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {petugas.totalPelanggan.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
                    {petugas.ruteList.join(', ') || 'Belum ada rute'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => bukaModalEdit(petugas)}
                      className="h-7 text-xs gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Modal Tambah / Edit Petugas using shadcn Dialog */}
      <Dialog open={Boolean(modalPetugas)} onOpenChange={(open) => !open && setModalPetugas(null)}>
        {modalPetugas && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {modalPetugas.mode === 'tambah' ? 'Tambah Petugas Baru' : 'Edit Profil Petugas'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Konfigurasi profil dan penugasan pencatat meter lapangan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={simpanPetugas} className="space-y-4 text-xs pt-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  ID / NIP Petugas
                </label>
                <Input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={modalPetugas.mode === 'edit' || saving}
                  placeholder="Misal: DADANG, AGUS01"
                  required
                  className="font-mono uppercase text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  disabled={saving}
                  placeholder="Nama petugas"
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Nomor HP / WhatsApp
                </label>
                <Input
                  type="text"
                  value={formNoHp}
                  onChange={(e) => setFormNoHp(e.target.value)}
                  disabled={saving}
                  placeholder="08123456789"
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="aktifCheck"
                  checked={formAktif}
                  onCheckedChange={(checked) => setFormAktif(Boolean(checked))}
                  disabled={saving}
                />
                <label htmlFor="aktifCheck" className="font-medium text-foreground cursor-pointer select-none">
                  Status Aktif Bertugas
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalPetugas(null)}
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
                  {saving && <Spinner className="h-3 w-3" />}
                  Simpan Petugas
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
