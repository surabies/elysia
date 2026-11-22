'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CapaianPayloadLengkap } from '@/server/domain/capaian/capaian.types';
import { CapaianHeader } from './CapaianHeader';
import { CapaianSummaryCards } from './CapaianSummaryCards';
import { TabelTargetRealisasi } from './TabelTargetRealisasi';
import { TabelProgresBulanan } from './TabelProgresBulanan';
import { CapaianChartsSection } from './CapaianChartsSection';
import { RiwayatPerubahanSheet } from './RiwayatPerubahanSheet';
import {
  TableProperties,
  TrendingUp,
  BarChart3,
  AlertCircle,
  ClipboardPaste,
  Baseline,
  Table as TableIcon,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export type CapaianViewMode = 'target' | 'progres' | 'grafik';

export function CapaianPencatatanView() {
  const [wilayah, setWilayah] = React.useState('5');
  const [tahun, setTahun] = React.useState(2026);
  const [data, setData] = React.useState<CapaianPayloadLengkap | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [riwayatOpen, setRiwayatOpen] = React.useState(false);
  const [riwayatList, setRiwayatList] = React.useState<any[]>([]);

  // View Mode: Pisahkan tabel dan grafik secara eksklusif (pola persis Progres Petugas)
  const [viewMode, setViewMode] = React.useState<CapaianViewMode>('target');

  // Modal dialog states untuk aksi cepat
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState('');
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  const [baselineOpen, setBaselineOpen] = React.useState(false);
  const baselineItem = data?.tabelProgres.baris.find((b) => b.bulan === 0);
  const [slBaseline, setSlBaseline] = React.useState('22428');
  const [m3Baseline, setM3Baseline] = React.useState('345989');

  React.useEffect(() => {
    if (baselineItem) {
      setSlBaseline(String(baselineItem.realisasiSl ?? 22428));
      setM3Baseline(String(baselineItem.realisasiM3 ?? 345989));
    }
  }, [baselineItem]);

  // 1. Fetch Data Capaian
  const fetchData = React.useCallback(async (w: string, t: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cater/capaian?wilayah=${w}&tahun=${t}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat data capaian');
      }
      setData(json.data);
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Riwayat
  const fetchRiwayat = React.useCallback(async (w: string, t: number) => {
    try {
      const res = await fetch(`/api/cater/capaian/riwayat?wilayah=${w}&tahun=${t}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setRiwayatList(json.data || []);
      }
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    fetchData(wilayah, tahun);
    fetchRiwayat(wilayah, tahun);
  }, [wilayah, tahun, fetchData, fetchRiwayat]);

  // 3. Update Target Individual
  const handleUpdateTarget = async (bulan: number, targetSl: number, targetM3: number) => {
    try {
      const res = await fetch('/api/cater/capaian/target', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayahId: wilayah,
          tahun,
          bulan,
          targetSl,
          targetM3,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah target');
      }
      setData(json.data);
      toast.success(`Target bulan ${bulan} berhasil diperbarui.`);
      fetchRiwayat(wilayah, tahun);
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  // 4. Bulk Update Target
  const handleBulkUpdateTarget = async (
    items: Array<{ bulan: number; targetSl: number; targetM3: number }>
  ) => {
    try {
      const res = await fetch('/api/cater/capaian/target/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayahId: wilayah,
          tahun,
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menerapkan target bulk');
      }
      setData(json.data);
      toast.success(`${items.length} bulan target berhasil diperbarui.`);
      fetchRiwayat(wilayah, tahun);
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleProcessBulk = async () => {
    setBulkError(null);
    if (!bulkText.trim()) {
      setBulkError('Teks paste tidak boleh kosong.');
      return;
    }

    const lines = bulkText.trim().split('\n');
    const parsedItems: Array<{ bulan: number; targetSl: number; targetM3: number }> = [];

    for (let i = 0; i < lines.length && i < 12; i++) {
      const parts = lines[i].split(/[\t,;]+/).map((s) => s.trim().replace(/\./g, ''));
      if (parts.length >= 2) {
        const sl = parseInt(parts[0], 10);
        const m3 = parseInt(parts[1], 10);
        if (!isNaN(sl) && !isNaN(m3)) {
          parsedItems.push({ bulan: i + 1, targetSl: sl, targetM3: m3 });
        }
      }
    }

    if (parsedItems.length === 0) {
      setBulkError(
        'Format tidak dikenali. Salin 2 kolom (Target SL & Target M³) dari Excel untuk 12 baris.'
      );
      return;
    }

    try {
      await handleBulkUpdateTarget(parsedItems);
      setBulkOpen(false);
      setBulkText('');
    } catch (err: any) {
      setBulkError(err.message || 'Gagal menyimpan bulk update');
    }
  };

  // 5. Update Baseline Des Tahun Lalu (Bulan 0)
  const handleUpdateBaselineDesember = async (sl: number, m3: number) => {
    try {
      const res = await fetch('/api/cater/capaian/realisasi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayahId: wilayah,
          tahun,
          bulan: 0,
          realisasiSl: sl,
          realisasiM3: m3,
          sumber: 'MANUAL',
          dikunci: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah baseline');
      }
      setData(json.data);
      toast.success('Baseline Desember tahun lalu berhasil disimpan.');
      fetchRiwayat(wilayah, tahun);
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleSaveBaseline = async () => {
    const sl = parseInt(slBaseline.replace(/\D/g, ''), 10);
    const m3 = parseInt(m3Baseline.replace(/\D/g, ''), 10);
    if (isNaN(sl) || isNaN(m3)) return;

    await handleUpdateBaselineDesember(sl, m3);
    setBaselineOpen(false);
  };

  // 6. Update Hari Acuan LPS
  const handleUpdateHariAcuanLps = async (hariAcuanLps: number) => {
    try {
      const res = await fetch('/api/cater/capaian/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayahId: wilayah,
          tahun,
          hariAcuanLps,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah pengaturan');
      }
      setData(json.data);
      toast.success(`Hari acuan LPS diubah menjadi ${hariAcuanLps} hari.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // 7. Sync Ulang dari Transaksi Fisik
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/cater/capaian/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayahId: wilayah,
          tahun,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal sinkronisasi data');
      }
      setData(json.data);
      toast.success('Data realisasi transaksi fisik berhasil disinkronkan.');
      fetchRiwayat(wilayah, tahun);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card Konsisten (Ambient Lighting + Telemetry Ribbon) */}
      <CapaianHeader
        wilayah={wilayah}
        onWilayahChange={setWilayah}
        tahun={tahun}
        onTahunChange={setTahun}
        hariAcuanLps={data?.pengaturan.hariAcuanLps ?? 30}
        onUpdateHariAcuanLps={handleUpdateHariAcuanLps}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenRiwayat={() => {
          fetchRiwayat(wilayah, tahun);
          setRiwayatOpen(true);
        }}
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl border border-border bg-muted/20 animate-pulse" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl border border-border bg-muted/20 animate-pulse" />
        </div>
      ) : !data ? (
        <div className="text-center py-12 rounded-xl border border-border bg-card">
          <AlertCircle className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-semibold text-foreground">
            Data capaian tidak dapat dimuat
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Silakan periksa koneksi atau coba sinkronisasi ulang.
          </p>
        </div>
      ) : (
        <>
          {/* 2. Ringkasan 4 Kartu KPI Vercel Geist Resmi (Menggunakan MetricCard + Sparkline) */}
          <CapaianSummaryCards
            ringkasanTarget={data.tabelTargetRealisasi.ringkasan}
            ringkasanProgres={data.tabelProgres.ringkasan}
            barisTarget={data.tabelTargetRealisasi.baris}
            barisProgres={data.tabelProgres.baris}
            wilayah={wilayah}
            tahun={tahun}
          />

          {/* 3. Panel Terpadu: Tabel dan Grafik Terpisah Mengikuti Pola Progres Petugas */}
          <div className="space-y-3">
            {/* Toolbar Panel Kontrol: Judul & Switcher View Mode (Tabel vs Grafik) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
              <div>
                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                  {viewMode === 'target' && 'Target & Realisasi Capaian (Tabel 2)'}
                  {viewMode === 'progres' && 'Progress Capaian Wilayah (Tabel 1)'}
                  {viewMode === 'grafik' && 'Visualisasi Grafik Capaian (5 Seri)'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {viewMode === 'target' &&
                    'Evaluasi Target vs Realisasi SL, M³, Capaian %, Debit LPS, dan Selisih dengan inline editing.'}
                  {viewMode === 'progres' &&
                    'Riwayat realisasi penuh, konsumsi M³/SL/Hari, dan pergerakan delta fluktuasi bulanan.'}
                  {viewMode === 'grafik' &&
                    'Eksplorasi visualisasi tren volume M³, rasio efisiensi, dan pertumbuhan pelanggan.'}
                </p>
              </div>

              {/* View Switcher Bergaya Halaman Progres Petugas (Tab Active Putih Bersih) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/40 shadow-2xs">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setViewMode('target')}
                    className={`h-7 px-3 text-[11px] gap-1.5 font-medium rounded-md transition-all ${
                      viewMode === 'target'
                        ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                    }`}
                    title="Tampilan Tabel Target & Realisasi"
                  >
                    <TableProperties className="size-3.5 text-blue-600" />
                    <span>Target & Realisasi</span>
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setViewMode('progres')}
                    className={`h-7 px-3 text-[11px] gap-1.5 font-medium rounded-md transition-all ${
                      viewMode === 'progres'
                        ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                    }`}
                    title="Tampilan Tabel Progres Bulanan"
                  >
                    <TrendingUp className="size-3.5 text-emerald-600" />
                    <span>Progres Bulanan</span>
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setViewMode('grafik')}
                    className={`h-7 px-3 text-[11px] gap-1.5 font-medium rounded-md transition-all ${
                      viewMode === 'grafik'
                        ? 'bg-white dark:bg-card text-foreground shadow-xs border border-border/80 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                    }`}
                    title="Tampilan Visualisasi Grafik"
                  >
                    <BarChart3 className="size-3.5 text-purple-600" />
                    <span>Grafik (5 Seri)</span>
                  </Button>
                </div>

                {/* Tombol Aksi Kontekstual */}
                {viewMode === 'target' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkOpen(true)}
                    className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
                  >
                    <ClipboardPaste className="size-3.5" />
                    <span className="hidden sm:inline">Tempel Excel</span>
                  </Button>
                )}

                {viewMode === 'progres' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBaselineOpen(true)}
                    className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
                  >
                    <Baseline className="size-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Ubah Baseline Des</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Container Konten: Eksklusif Terpisah (Hanya Salah Satu yang Ditampilkan) */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {viewMode === 'target' && (
                <TabelTargetRealisasi
                  baris={data.tabelTargetRealisasi.baris}
                  ringkasan={data.tabelTargetRealisasi.ringkasan}
                  onUpdateTarget={handleUpdateTarget}
                  onBulkUpdateTarget={handleBulkUpdateTarget}
                  hideHeaderCard={true}
                />
              )}

              {viewMode === 'progres' && (
                <TabelProgresBulanan
                  baris={data.tabelProgres.baris}
                  ringkasan={data.tabelProgres.ringkasan}
                  onUpdateBaselineDesember={handleUpdateBaselineDesember}
                  hideHeaderCard={true}
                />
              )}

              {viewMode === 'grafik' && (
                <CapaianChartsSection grafik={data.grafik} />
              )}
            </div>
          </div>

          {/* Modal Tempel Excel */}
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  Tempel Target 12 Bulan dari Excel
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Salin 2 kolom dari Excel (Kolom 1: <strong>Target SL</strong>, Kolom 2: <strong>Target M³</strong>) untuk 12 baris bulan Januari s.d. Desember, lalu tempel di bawah:
                </p>
                <Textarea
                  placeholder="22450	340000&#10;22470	338000&#10;22490	345000..."
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="font-mono text-xs"
                />
                {bulkError && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-md">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>
                  Batal
                </Button>
                <Button size="sm" onClick={handleProcessBulk}>
                  Terapkan Target
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal Edit Baseline */}
          <Dialog open={baselineOpen} onOpenChange={setBaselineOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  Ubah Baseline Desember Tahun Lalu
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Realisasi Sambungan Langganan (SL)
                  </label>
                  <Input
                    type="text"
                    value={slBaseline}
                    onChange={(e) => setSlBaseline(e.target.value)}
                    className="mt-1 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Realisasi Kubikasi (M³)
                  </label>
                  <Input
                    type="text"
                    value={m3Baseline}
                    onChange={(e) => setM3Baseline(e.target.value)}
                    className="mt-1 text-sm font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBaselineOpen(false)}
                >
                  Batal
                </Button>
                <Button size="sm" onClick={handleSaveBaseline}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 4. Sheet Riwayat Log Audit */}
          <RiwayatPerubahanSheet
            open={riwayatOpen}
            onOpenChange={setRiwayatOpen}
            riwayat={riwayatList}
          />
        </>
      )}
    </div>
  );
}
