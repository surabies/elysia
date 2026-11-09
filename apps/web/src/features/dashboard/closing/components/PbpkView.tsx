'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  RefreshCw,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Sparkles,
  Users,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface PbpkData {
  periode: string;
  ringkasan: {
    totalMasterPelanggan: number;
    totalPasangBaru: number;
    totalPerubahanKategori: number;
    statusIntegrasiDpm: string;
  };
  daftarPasangBaru: Array<{
    nolg: string;
    nama: string;
    alamat: string;
    tarifKode: string | null;
    ruteKode: string | null;
    noMeter: string | null;
    noTelp: string | null;
    createdAt: string;
  }>;
  masterTarif: Array<{ kode: string; nama: string }>;
  masterRute: Array<{ kode: string; nama: string }>;
}

export function PbpkView() {
  const [periode, setPeriode] = React.useState('202601');
  const [data, setData] = React.useState<PbpkData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states: Pasang Baru (PB)
  const [showPbDialog, setShowPbDialog] = React.useState(false);
  const [pbNolg, setPbNolg] = React.useState('');
  const [pbNama, setPbNama] = React.useState('');
  const [pbAlamat, setPbAlamat] = React.useState('');
  const [pbTarif, setPbTarif] = React.useState('2A2');
  const [pbRute, setPbRute] = React.useState('CD104');
  const [pbNoMeter, setPbNoMeter] = React.useState('');
  const [pbNoTelp, setPbNoTelp] = React.useState('');

  // Form states: Perubahan Kategori (PK)
  const [showPkDialog, setShowPkDialog] = React.useState(false);
  const [pkNolg, setPkNolg] = React.useState('');
  const [pkTarifBaru, setPkTarifBaru] = React.useState('3C');
  const [pkNomorSk, setPkNomorSk] = React.useState('');
  const [pkAlasan, setPkAlasan] = React.useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = React.useState('');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/closing/pbpk/${periode}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setFeedback({ type: 'error', message: json.error || 'Gagal memuat data PBPK.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Pasang Baru
  const handleSimpanPasangBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/closing/pbpk/pasang-baru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nolg: pbNolg,
          nama: pbNama,
          alamat: pbAlamat,
          tarifKode: pbTarif,
          ruteKode: pbRute,
          noMeter: pbNoMeter,
          noTelp: pbNoTelp || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        setShowPbDialog(false);
        // Reset form
        setPbNolg('');
        setPbNama('');
        setPbAlamat('');
        setPbNoMeter('');
        setPbNoTelp('');
        loadData();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Gagal menyimpan pasang baru.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Perubahan Kategori
  const handleSimpanPerubahanKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/closing/pbpk/perubahan-kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nolg: pkNolg,
          tarifKodeBaru: pkTarifBaru,
          nomorSk: pkNomorSk || undefined,
          alasan: pkAlasan || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        setShowPkDialog(false);
        setPkNolg('');
        setPkNomorSk('');
        setPkAlasan('');
        loadData();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Gagal mengubah kategori tarif.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPb = (data?.daftarPasangBaru ?? []).filter(
    (p) =>
      p.nolg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.alamat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  PBPK (Pasang Baru & Perubahan Kategori)
                </h1>
                <Badge variant="outline" className="text-[10px] font-semibold py-0.5 bg-blue-500/10 text-blue-600 border-blue-300">
                  Tahap 1 Pra-Closing
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pengelolaan mutasi sambungan baru dan mutasi golongan tarif yang akan diinjeksi ke DPM bulan berikutnya (N+1).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
            <span className="text-xs font-medium px-2 text-muted-foreground">Periode THBL:</span>
            <Input
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-24 h-8 text-xs font-mono text-center bg-background"
              placeholder="YYYYMM"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Muat Ulang
            </Button>
          </div>

          <Link href="/tools-tutup/monitoring-tutup-bulan">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              Konsol Closing <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-md border text-xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFeedback(null)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Master Pelanggan Terdaftar</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">
              {loading ? '-' : (data?.ringkasan.totalMasterPelanggan ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-muted-foreground font-mono">SL</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Total sambungan aktif di database</p>
        </Card>

        <Card className="p-4 bg-card">
          <span className="text-xs font-semibold text-muted-foreground">Pasang Baru (PB) Periode Berjalan</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {loading ? '-' : (data?.daftarPasangBaru.length ?? 0)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">SL Baru</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Siap diinjeksi ke DPM N+1</p>
        </Card>

        <Card className="p-4 bg-card border-blue-500/30">
          <span className="text-xs font-semibold text-foreground">Status Sinkronisasi DPM N+1</span>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> SIAP CARRY-OVER
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Otomatis terbit saat Tahap 7 (Buka Bulan Baru) dieksekusi.
          </p>
        </Card>
      </div>

      {/* 3. Operational Tabs */}
      <Tabs defaultValue="pasang-baru" className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="pasang-baru" className="text-xs py-1.5 px-3 gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              1. Pasang Baru (PB)
            </TabsTrigger>
            <TabsTrigger value="perubahan-kategori" className="text-xs py-1.5 px-3 gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              2. Perubahan Kategori (PK)
            </TabsTrigger>
            <TabsTrigger value="alur-dpm" className="text-xs py-1.5 px-3 gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              3. Alur Injeksi DPM
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowPbDialog(true)}
              className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Input Pasang Baru (PB)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPkDialog(true)}
              className="h-8 text-xs gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Mutasi Golongan Tarif (PK)
            </Button>
          </div>
        </div>

        {/* TAB 1: PASANG BARU */}
        <TabsContent value="pasang-baru" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Daftar Sambungan Pasang Baru ({filteredPb.length} Sambungan)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pelanggan baru yang telah terpasang fisik di lapangan dan akan mulai dibebankan pencatatan meter pada siklus berikutnya.
                </p>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari no sambungan / nama..."
                  className="h-8 pl-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-[11px]">
                    <TableHead className="font-semibold">No Sambungan (NOLG)</TableHead>
                    <TableHead className="font-semibold">Nama Pelanggan</TableHead>
                    <TableHead className="font-semibold">Alamat</TableHead>
                    <TableHead className="font-semibold">Golongan Tarif</TableHead>
                    <TableHead className="font-semibold">Rute Cater</TableHead>
                    <TableHead className="font-semibold">No Seri Meter</TableHead>
                    <TableHead className="text-center font-semibold">Status DPM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        Memuat data pasang baru...
                      </TableCell>
                    </TableRow>
                  ) : filteredPb.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        Tidak ada data pasang baru yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPb.map((p, i) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="font-mono font-bold text-foreground">{p.nolg}</TableCell>
                        <TableCell className="font-medium text-foreground">{p.nama}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.alamat}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono font-bold text-primary">
                            {p.tarifKode ?? '2A2'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{p.ruteKode ?? '-'}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{p.noMeter ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                            SIAP N+1
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: PERUBAHAN KATEGORI */}
        <TabsContent value="perubahan-kategori" className="space-y-4">
          <Card className="p-6 space-y-4 max-w-2xl">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Mutasi Perubahan Kategori Tarif (PK)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pembaruan kategori golongan tarif pelanggan berdasarkan surat keputusan direksi atau penyesuaian fungsi bangunan.
              </p>
            </div>

            <form onSubmit={handleSimpanPerubahanKategori} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nomor Sambungan Pelanggan (NOLG):
                </label>
                <Input
                  value={pkNolg}
                  onChange={(e) => setPkNolg(e.target.value)}
                  placeholder="Contoh: 00302600011"
                  className="font-mono text-xs max-w-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Pilih Golongan Tarif Baru:
                </label>
                <NativeSelect
                  value={pkTarifBaru}
                  onChange={(e) => setPkTarifBaru(e.target.value)}
                  className="text-xs max-w-sm"
                >
                  {(data?.masterTarif ?? []).map((t) => (
                    <option key={t.kode} value={t.kode}>
                      {t.kode} - {t.nama}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nomor Surat Keputusan / Memo Direksi:
                </label>
                <Input
                  value={pkNomorSk}
                  onChange={(e) => setPkNomorSk(e.target.value)}
                  placeholder="SK-MUTASI/01/2026/045"
                  className="text-xs max-w-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Alasan Perubahan:
                </label>
                <Input
                  value={pkAlasan}
                  onChange={(e) => setPkAlasan(e.target.value)}
                  placeholder="Penyesuaian peruntukan rumah tinggal menjadi toko kelontong"
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={actionLoading}
                className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                {actionLoading && <Spinner className="w-3.5 h-3.5" />}
                Simpan Mutasi Tarif (PK)
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: ALUR BISNIS INJEKSI DPM */}
        <TabsContent value="alur-dpm" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Alur Bisnis PBPK ke Siklus Penagihan N+1
            </h2>
            <div className="p-4 rounded-lg bg-muted/40 border space-y-3 text-xs text-muted-foreground">
              <p>
                Di sistem pembacaan meter air utilitas (Perumda Tirtawening), data pelanggan tidak langsung dapat dicatat secara acak. Seluruh pencatatan lapangan dikunci ke dalam tabel <strong>Daftar Catat Meter (DPM)</strong> per periode.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <div className="font-bold text-foreground">Langkah 1: Input PBPK</div>
                  <p className="text-[11px]">
                    Admin menginput Sambungan Baru (PB) dan Mutasi Tarif (PK) di halaman ini selama bulan berjalan.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <div className="font-bold text-foreground">Langkah 2: Closing Periode N</div>
                  <p className="text-[11px]">
                    Periode berjalan ditutup dan rekening DRD resmi diterbitkan pada Tahap 5 Closing.
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <div className="font-bold text-foreground">Langkah 3: Buka Bulan Baru N+1</div>
                  <p className="text-[11px]">
                    Sistem mengeksekusi Tahap 7 (Buka Bulan Baru) yang secara otomatis menyerap seluruh PB baru ke dalam target DPM rute cater.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: INPUT PASANG BARU */}
      <Dialog open={showPbDialog} onOpenChange={setShowPbDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Pendaftaran Pasang Baru (SL Baru)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Masukkan data sambungan langganan baru yang telah terpasang fisik di lapangan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSimpanPasangBaru} className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nomor Sambungan (NOLG):</label>
              <Input
                value={pbNolg}
                onChange={(e) => setPbNolg(e.target.value)}
                placeholder="Contoh: 00901234567"
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nama Pelanggan:</label>
              <Input
                value={pbNama}
                onChange={(e) => setPbNama(e.target.value)}
                placeholder="Nama lengkap pemilik sambungan"
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Alamat Pemasangan:</label>
              <Input
                value={pbAlamat}
                onChange={(e) => setPbAlamat(e.target.value)}
                placeholder="Jalan, No Rumah, RT/RW, Kelurahan"
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Golongan Tarif:</label>
                <NativeSelect
                  value={pbTarif}
                  onChange={(e) => setPbTarif(e.target.value)}
                  className="text-xs"
                >
                  {(data?.masterTarif ?? []).map((t) => (
                    <option key={t.kode} value={t.kode}>
                      {t.kode} - {t.nama}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Rute Pembaca (Cater):</label>
                <NativeSelect
                  value={pbRute}
                  onChange={(e) => setPbRute(e.target.value)}
                  className="text-xs"
                >
                  {(data?.masterRute ?? []).map((r) => (
                    <option key={r.kode} value={r.kode}>
                      {r.kode} - {r.nama}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nomor Seri Meter:</label>
                <Input
                  value={pbNoMeter}
                  onChange={(e) => setPbNoMeter(e.target.value)}
                  placeholder="Contoh: 24089912"
                  className="font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">No Telepon / WhatsApp:</label>
                <Input
                  value={pbNoTelp}
                  onChange={(e) => setPbNoTelp(e.target.value)}
                  placeholder="08123456789"
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPbDialog(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {actionLoading && <Spinner className="w-3.5 h-3.5 mr-1" />}
                Daftarkan Sambungan Baru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
