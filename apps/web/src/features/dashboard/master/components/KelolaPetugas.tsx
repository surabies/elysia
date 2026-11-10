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
import { PageContainer } from '@/components/layout/page/PageContainer';
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
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-heading-20 text-foreground">
            Kelola Master Petugas Cater
          </h1>
          <p className="mt-1 text-copy-13 text-muted-foreground">
            Manajemen profil, status aktif, dan nomor kontak petugas pencatat meter lapangan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Segarkan
          </Button>

          <Button
            size="sm"
            onClick={bukaModalTambah}
          >
            <Plus className="size-3.5" />
            Tambah Petugas
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Total Petugas</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-heading-24 font-mono tabular-nums text-foreground">
            {totalPetugas}
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Petugas terdaftar di sistem</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Status Aktif</span>
            <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-heading-24 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {aktifCount} / {totalPetugas}
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Siap bertugas di lapangan</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Rute Terdistribusi</span>
            <Route className="size-4 text-(--ds-blue-900)" />
          </div>
          <div className="mt-2 text-heading-24 font-mono tabular-nums text-(--ds-blue-900)">
            {totalRute}
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Rute terpetakan ke petugas</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Beban Pelanggan</span>
            <Users className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-heading-24 font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {totalPelanggan.toLocaleString('id-ID')}
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">Pelanggan aktif dalam rute</p>
        </Card>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              size="sm"
              placeholder="Cari nama atau NIP petugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-card"
            />
          </div>

          <Link
            href="/master/pemetaan-petugas"
            className="inline-flex items-center gap-1.5 text-label-13 text-(--ds-blue-900) hover:underline"
          >
            Buka Pemetaan Rute &rarr;
          </Link>
        </div>

        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
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
                  <TableCell className="font-mono font-medium text-foreground">
                    {petugas.id}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full border border-border bg-(--ds-gray-100) text-foreground flex items-center justify-center text-label-11 shrink-0">
                        {petugas.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{petugas.nama}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {petugas.noHp ? (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" />
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
                        petugas.aktif
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400'
                          : 'bg-(--ds-gray-100) text-muted-foreground'
                      )}
                    >
                      {petugas.aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-medium text-(--ds-blue-900)">
                    {petugas.totalRute}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums font-medium text-foreground">
                    {petugas.totalPelanggan.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-label-12 text-muted-foreground">
                    {petugas.ruteList.join(', ') || 'Belum ada rute'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => bukaModalEdit(petugas)}
                    >
                      <Edit2 className="size-3" />
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
              <DialogTitle>
                {modalPetugas.mode === 'tambah' ? 'Tambah Petugas Baru' : 'Edit Profil Petugas'}
              </DialogTitle>
              <DialogDescription>
                Konfigurasi profil dan penugasan pencatat meter lapangan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={simpanPetugas} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-label-13 text-foreground block">
                  ID / NIP Petugas
                </label>
                <Input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={modalPetugas.mode === 'edit' || saving}
                  placeholder="Misal: DADANG, AGUS01"
                  required
                  className="font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-13 text-foreground block">
                  Nama Lengkap
                </label>
                <Input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  disabled={saving}
                  placeholder="Nama petugas"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-13 text-foreground block">
                  Nomor HP / WhatsApp
                </label>
                <Input
                  type="text"
                  value={formNoHp}
                  onChange={(e) => setFormNoHp(e.target.value)}
                  disabled={saving}
                  placeholder="08123456789"
                  className="font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="aktifCheck"
                  checked={formAktif}
                  onCheckedChange={(checked) => setFormAktif(Boolean(checked))}
                  disabled={saving}
                />
                <label htmlFor="aktifCheck" className="text-label-13 text-foreground cursor-pointer select-none">
                  Status Aktif Bertugas
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalPetugas(null)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                >
                  {saving && <Spinner className="size-3.5" />}
                  Simpan Petugas
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </PageContainer>
  );
}
