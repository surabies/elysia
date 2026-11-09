'use client';

import * as React from 'react';
import {
  Users,
  Navigation,
  User,
  Zap,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type {
  ItemPreviewTaksasi,
  PreviewTaksasiResult,
  PetugasOption,
  RuteOption,
} from '@/server/services/cater/manual-add-masal.service';

const numberFormat = new Intl.NumberFormat('id-ID');

export const ALASAN_MASAL_OPTIONS = [
  { value: 'PETUGAS_SAKIT', label: 'Petugas Sakit / Berhalangan Dinas' },
  { value: 'JALUR_TERHALANG', label: 'Rute Terhalang Bencana / Banjir / Proyek' },
  { value: 'DEADLINE_CLOSING', label: 'Taksiran Masal Deadline Penutupan Rekening DRD' },
  { value: 'RUMAH_KOSONG_MASAL', label: 'Kawasan Rumah Kosong / Perumahan Tertutup' },
] as const;

interface ManualAddMasalTaksasiProps {
  periode: string;
  onSuccess: () => void;
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void;
}

export function ManualAddMasalTaksasi({
  periode,
  onSuccess,
  setNotification,
}: ManualAddMasalTaksasiProps) {
  const [filterOptions, setFilterOptions] = React.useState<{
    petugas: PetugasOption[];
    rute: RuteOption[];
  }>({
    petugas: [],
    rute: [],
  });

  const [filterPetugas, setFilterPetugas] = React.useState<string>('all');
  const [filterRute, setFilterRute] = React.useState<string>('all');
  const [hanyaBelumBaca, setHanyaBelumBaca] = React.useState<boolean>(true);

  const [previewLoading, setPreviewLoading] = React.useState<boolean>(false);
  const [previewData, setPreviewData] = React.useState<PreviewTaksasiResult | null>(null);
  const [selectedNolgs, setSelectedNolgs] = React.useState<Set<string>>(new Set());

  const [alasanMasal, setAlasanMasal] = React.useState<string>(ALASAN_MASAL_OPTIONS[0].label);
  const [memoMasal, setMemoMasal] = React.useState<string>(
    'Disposisi Supervisor Cater dikarenakan petugas berhalangan.'
  );
  const [submittingMasal, setSubmittingMasal] = React.useState<boolean>(false);

  // 1. Fetch initial options (petugas & rute) from backend
  React.useEffect(() => {
    fetch('/api/v1/manual-add/masal/options')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setFilterOptions(json.data);
        }
      })
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // 2. Fetch preview taksasi
  const fetchPreviewMasal = async () => {
    if (filterPetugas === 'all' && filterRute === 'all') {
      setNotification({
        type: 'error',
        message: 'Silakan pilih Petugas atau Rute terlebih dahulu.',
      });
      return;
    }

    setPreviewLoading(true);
    setNotification(null);
    try {
      const params = new URLSearchParams({
        periode,
        hanyaBelumBaca: String(hanyaBelumBaca),
      });
      if (filterPetugas !== 'all') params.append('pencatatId', filterPetugas);
      if (filterRute !== 'all') params.append('ruteKode', filterRute);

      const res = await fetch(`/api/v1/manual-add/masal/preview?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);
        // Default: centang semua item
        setSelectedNolgs(new Set(json.data.items.map((i: ItemPreviewTaksasi) => i.nolg)));
      } else {
        setNotification({
          type: 'error',
          message: json.error?.message || 'Gagal memuat pratinjau taksasi masal.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat memuat preview.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // 3. Selection toggles
  const toggleSelectAll = () => {
    if (!previewData) return;
    if (selectedNolgs.size === previewData.items.length) {
      setSelectedNolgs(new Set());
    } else {
      setSelectedNolgs(new Set(previewData.items.map((i) => i.nolg)));
    }
  };

  const toggleSelectRow = (nolg: string) => {
    const next = new Set(selectedNolgs);
    if (next.has(nolg)) {
      next.delete(nolg);
    } else {
      next.add(nolg);
    }
    setSelectedNolgs(next);
  };

  // 4. Submit Bulk Taksasi
  const handleSubmitMasal = async () => {
    if (!previewData || selectedNolgs.size === 0) {
      setNotification({
        type: 'error',
        message: 'Pilih minimal satu pelanggan untuk dieksekusi.',
      });
      return;
    }

    const itemsToExecute = previewData.items
      .filter((i) => selectedNolgs.has(i.nolg))
      .map((i) => ({
        nolg: i.nolg,
        ruteKode: i.ruteKode ?? null,
        stml: i.stml,
        stma: i.stmaTaksasi,
        pakaiM3: i.pakaiM3Taksasi,
      }));

    setSubmittingMasal(true);
    setNotification(null);

    try {
      const res = await fetch('/api/v1/manual-add/masal/eksekusi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode: Number(periode),
          alasanKategori: alasanMasal,
          catatanBeritaAcara: memoMasal,
          items: itemsToExecute,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotification({
          type: 'success',
          message: `Berhasil menerbitkan Taksasi Masal untuk ${json.data.totalDiproses} pelanggan ke database periode ${periode}.`,
        });
        onSuccess();
        fetchPreviewMasal();
      } else {
        setNotification({
          type: 'error',
          message: json.error?.message || 'Gagal mengeksekusi Taksasi Masal.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Terjadi kesalahan eksekusi.',
      });
    } finally {
      setSubmittingMasal(false);
    }
  };

  const isAllSelected =
    previewData && previewData.items.length > 0 && selectedNolgs.size === previewData.items.length;
  const isIndeterminate =
    previewData &&
    previewData.items.length > 0 &&
    selectedNolgs.size > 0 &&
    selectedNolgs.size < previewData.items.length;

  return (
    <div className="space-y-6">
      {/* 1. Filter Kontrol Taksasi Dinamis */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-label-14 font-semibold flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                Disposisi & Taksasi Masal Petugas Berhalangan
              </CardTitle>
              <CardDescription className="text-copy-13 mt-0.5">
                Gunakan modul ini jika petugas catat meter sakit atau rute terhalang. Sistem menghitung taksasi otomatis berdasarkan Perdir PDAM.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 bg-amber-500/10 font-mono">
              Engine Taksasi Perdir
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Filter Petugas */}
            <div className="space-y-1.5">
              <label className="text-label-12 font-medium text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" />
                Pilih Petugas (Jika Sakit/Izin):
              </label>
              <NativeSelect
                value={filterPetugas}
                onChange={(e) => {
                  setFilterPetugas(e.target.value);
                  if (e.target.value !== 'all') setFilterRute('all');
                }}
                className="w-full text-copy-13"
                size="sm"
              >
                <NativeSelectOption value="all">-- Semua Petugas / Pilih Rute Saja --</NativeSelectOption>
                {filterOptions.petugas.map((p) => (
                  <NativeSelectOption key={p.id} value={p.id}>
                    Petugas {p.nama} ({p.id})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Filter Rute */}
            <div className="space-y-1.5">
              <label className="text-label-12 font-medium text-foreground flex items-center gap-1.5">
                <Navigation className="size-3.5 text-teal-500" />
                Pilih Rute Tertentu (Opsional):
              </label>
              <NativeSelect
                value={filterRute}
                onChange={(e) => {
                  setFilterRute(e.target.value);
                  if (e.target.value !== 'all') setFilterPetugas('all');
                }}
                className="w-full text-copy-13 font-mono"
                size="sm"
              >
                <NativeSelectOption value="all">-- Seluruh Rute Petugas Terpilih --</NativeSelectOption>
                {filterOptions.rute.map((r) => (
                  <NativeSelectOption key={r.kode} value={r.kode}>
                    {r.kode} {r.seksiNama ? `(${r.seksiNama})` : ''} - Petugas {r.pencatatDefault ?? '-'}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Opsi Filter & Tombol Kalkulasi */}
            <div className="flex flex-col justify-end gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-belum-baca"
                  checked={hanyaBelumBaca}
                  onCheckedChange={(checked) => setHanyaBelumBaca(Boolean(checked))}
                />
                <label
                  htmlFor="filter-belum-baca"
                  className="text-label-12 text-muted-foreground cursor-pointer select-none font-medium"
                >
                  Hanya pelanggan yang <strong className="text-foreground">belum terbaca</strong>
                </label>
              </div>

              <Button
                onClick={fetchPreviewMasal}
                disabled={previewLoading || (filterPetugas === 'all' && filterRute === 'all')}
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
              >
                {previewLoading ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Calculator className="size-3.5" />
                )}
                Hitung & Pratinjau Taksasi Masal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Area Hasil Pratinjau Taksasi Masal */}
      {previewLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6 text-primary" />
            <p className="text-copy-13 text-muted-foreground">
              Menghitung taksasi perdir untuk pelanggan di rute terpilih...
            </p>
          </div>
        </div>
      ) : !previewData || previewData.items.length === 0 ? (
        <Card className="border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-2">
            <Info className="size-8 text-muted-foreground" />
            <h4 className="text-label-14 font-semibold text-foreground">
              Pilih Petugas yang berhalangan atau Rute Baca di atas
            </h4>
            <p className="text-copy-13 text-muted-foreground">
              Sistem akan mendeteksi seluruh pelanggan di rute yang belum tercatat dan mengestimasi kubikasi menggunakan formula historis pemakaian resmi PDAM.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* KPI Pratinjau Masal & Form Eksekusi */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Ringkasan Calon Taksasi (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
              <Card className="p-3.5 border-border bg-card">
                <span className="text-label-11 text-muted-foreground block">Pelanggan Siap Taksasi</span>
                <span className="text-xl font-bold font-mono text-primary">
                  {numberFormat.format(previewData.items.length)} SL
                </span>
                <p className="text-label-11 text-muted-foreground mt-0.5">
                  {selectedNolgs.size} terpilih
                </p>
              </Card>

              <Card className="p-3.5 border-border bg-card">
                <span className="text-label-11 text-muted-foreground block">Estimasi Volume m³</span>
                <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                  {numberFormat.format(previewData.kpi.totalEstimasiM3)} m³
                </span>
                <p className="text-label-11 text-muted-foreground mt-0.5">
                  Rata-rata 3 bulan lalu
                </p>
              </Card>

              <Card className="col-span-2 p-3.5 border-border bg-card text-copy-13 space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Target Wilayah / Petugas:</span>
                  <strong className="text-foreground">
                    {filterPetugas !== 'all' ? `Petugas ${filterPetugas}` : `Rute ${filterRute}`}
                  </strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Pelanggan Sudah Terbaca:</span>
                  <span className="font-mono text-emerald-600 font-semibold">{previewData.kpi.totalSudahTerbaca} SL</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Pelanggan Belum Terbaca:</span>
                  <span className="font-mono text-amber-600 font-bold">{previewData.kpi.totalBelumTerbaca} SL</span>
                </div>
              </Card>
            </div>

            {/* Konfigurasi Berita Acara & Tombol Eksekusi (7 cols) */}
            <Card className="lg:col-span-7 border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3 className="text-label-12 font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  Konfirmasi Berita Acara Taksasi Masal
                </h3>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Periode {periode}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-label-11 font-medium text-foreground">Alasan Taksasi Masal *</label>
                  <NativeSelect
                    value={alasanMasal}
                    onChange={(e) => setAlasanMasal(e.target.value)}
                    className="w-full text-copy-13"
                    size="sm"
                  >
                    {ALASAN_MASAL_OPTIONS.map((opt) => (
                      <NativeSelectOption key={opt.value} value={opt.label}>
                        {opt.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-1">
                  <label className="text-label-11 font-medium text-foreground">Nomor Memo / Berita Acara *</label>
                  <Input
                    value={memoMasal}
                    onChange={(e) => setMemoMasal(e.target.value)}
                    placeholder="Contoh: Memo Disposisi No. 45/CATER/I/2026..."
                    className="h-8 text-copy-13"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="text-copy-13 text-muted-foreground">
                  <span>Terpilih: </span>
                  <strong className="text-foreground font-mono">{selectedNolgs.size}</strong> dari{' '}
                  <span className="font-mono">{previewData.items.length}</span> pelanggan
                </div>

                <Button
                  onClick={handleSubmitMasal}
                  disabled={submittingMasal || selectedNolgs.size === 0}
                  size="sm"
                  className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submittingMasal ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  Eksekusi Taksasi ({selectedNolgs.size} Pelanggan)
                </Button>
              </div>
            </Card>
          </div>

          {/* Tabel Pratinjau Taksasi Masal menggunakan shadcn Table */}
          <Card className="border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <Checkbox
                      checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Pilih semua baris"
                    />
                  </TableHead>
                  <TableHead>No. Langganan</TableHead>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Alamat & Rute</TableHead>
                  <TableHead className="text-right">Stand Lalu (STML)</TableHead>
                  <TableHead className="text-right">Stand Akhir Taksasi</TableHead>
                  <TableHead className="text-right">Estimasi m³</TableHead>
                  <TableHead className="text-center">Metode Taksasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.items.map((item) => {
                  const isChecked = selectedNolgs.has(item.nolg);
                  return (
                    <TableRow
                      key={item.nolg}
                      data-state={isChecked ? 'selected' : undefined}
                      className={cn(isChecked && 'bg-primary/5')}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelectRow(item.nolg)}
                          aria-label={`Pilih ${item.nolg}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-foreground">
                        {item.nolg}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {item.nama}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-label-11">
                        <span className="truncate max-w-[200px] block">{item.alamat}</span>
                        <span className="font-mono text-primary text-[10px]">Rute: {item.ruteKode ?? '-'}</span>
                      </TableCell>
                      <TableCell className="font-mono text-right text-muted-foreground">
                        {numberFormat.format(item.stml)}
                      </TableCell>
                      <TableCell className="font-mono text-right font-bold text-foreground">
                        {numberFormat.format(item.stmaTaksasi)}
                      </TableCell>
                      <TableCell className="font-mono text-right font-bold text-teal-600 dark:text-teal-400">
                        {numberFormat.format(item.pakaiM3Taksasi)} m³
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={item.metodeTaksasi === 'RATA_RATA_HISTORIS' ? 'secondary' : 'outline'}
                          className="text-[10px] font-mono"
                        >
                          {item.metodeTaksasi === 'RATA_RATA_HISTORIS' ? 'Rata-Rata 3 Bln' : 'Standar Min (5 m³)'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
