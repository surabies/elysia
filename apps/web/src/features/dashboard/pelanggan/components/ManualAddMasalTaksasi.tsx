'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  { value: 'DEADLINE_CLOSING', label: 'Taksiran Masal Deadline Penutupan DRD' },
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
  // Memungkinkan operator menyesuaikan angka Pakai (m3) per baris sebelum eksekusi
  const [overridePakai, setOverridePakai] = React.useState<Record<string, number>>({});

  const [alasanMasal, setAlasanMasal] = React.useState<string>(ALASAN_MASAL_OPTIONS[0].label);
  const [memoMasal, setMemoMasal] = React.useState<string>(
    'Disposisi Supervisor Cater dikarenakan petugas berhalangan.'
  );
  const [submittingMasal, setSubmittingMasal] = React.useState<boolean>(false);

  // 1. Muat opsi filter Petugas & Rute
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

  // Cascading Filter: Daftar Rute otomatis menyesuaikan dengan Petugas yang dipilih
  const ruteTersaring = React.useMemo(() => {
    if (filterPetugas === 'all') return filterOptions.rute;
    return filterOptions.rute.filter((r) => r.pencatatDefault === filterPetugas);
  }, [filterOptions.rute, filterPetugas]);

  // 2. Muat pratinjau taksasi otomatis setiap kali filter Petugas / Rute / Belum Baca berubah
  const fetchPreviewMasal = React.useCallback(async () => {
    if (filterPetugas === 'all' && filterRute === 'all') {
      setPreviewData(null);
      setSelectedNolgs(new Set());
      return;
    }

    setPreviewLoading(true);
    setNotification(null);
    try {
      const params = new URLSearchParams({
        periode,
        hanyaBelumBaca: String(hanyaBelumBaca),
      });
      if (filterPetugas !== 'all') params.append('petugasId', filterPetugas);
      if (filterRute !== 'all') params.append('ruteKode', filterRute);

      const res = await fetch(`/api/v1/manual-add/masal/preview?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPreviewData(json.data);
        setOverridePakai({});
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
        message: err.message || 'Terjadi kesalahan saat memuat pratinjau.',
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [periode, filterPetugas, filterRute, hanyaBelumBaca, setNotification]);

  React.useEffect(() => {
    void fetchPreviewMasal();
  }, [fetchPreviewMasal]);

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

  const ambilPakaiFinal = (item: ItemPreviewTaksasi) =>
    overridePakai[item.nolg] !== undefined
      ? overridePakai[item.nolg]
      : item.pakaiM3Taksasi;

  const totalVolumeTerpilih = React.useMemo(() => {
    if (!previewData) return 0;
    return previewData.items
      .filter((i) => selectedNolgs.has(i.nolg))
      .reduce((sum, i) => sum + ambilPakaiFinal(i), 0);
  }, [previewData, selectedNolgs, overridePakai]);

  const handleSubmitMasal = async () => {
    if (!previewData || selectedNolgs.size === 0) {
      setNotification({
        type: 'error',
        message: 'Pilih minimal satu pelanggan untuk dieksekusi.',
      });
      return;
    }

    // Sesuai kontrak DEC-01: ST Awal dan ST Akhir sama (stma = stml),
    // sedangkan pemakaian taksasi disimpan pada pakaiM3.
    const itemsToExecute = previewData.items
      .filter((i) => selectedNolgs.has(i.nolg))
      .map((i) => ({
        nolg: i.nolg,
        ruteKode: i.ruteKode ?? null,
        stml: i.stml,
        stma: i.stml,
        pakaiM3: ambilPakaiFinal(i),
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
          message: `Taksasi Masal berhasil disimpan untuk ${json.data.totalDiproses} pelanggan (ST Awal = ST Akhir, total ${numberFormat.format(totalVolumeTerpilih)} m³).`,
        });
        onSuccess();
        void fetchPreviewMasal();
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
    <div className="space-y-4">
      {/* 1. Bilah Filter & Konfigurasi Ringkas (Satu Panel Terpadu) */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 items-end">
          {/* Pilih Petugas (Ringkas: hanya Nama Petugas) */}
          <div className="lg:col-span-3 space-y-1">
            <label className="block text-label-12 font-medium text-foreground">
              Petugas
            </label>
            <Select
              value={filterPetugas}
              onValueChange={(nextPetugas) => {
                setFilterPetugas(nextPetugas);
                // Reset pilihan rute agar langsung menampilkan rute milik petugas terpilih
                setFilterRute('all');
              }}
            >
              <SelectTrigger size="sm" className="w-full text-copy-13">
                <SelectValue placeholder="Pilih Petugas" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Semua Petugas</SelectItem>
                {filterOptions.petugas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pilih Kode Rute (Tersaring otomatis sesuai Petugas, hanya Kode Rute) */}
          <div className="lg:col-span-2 space-y-1">
            <label className="block text-label-12 font-medium text-foreground">
              Kode Rute {filterPetugas !== 'all' && `(${ruteTersaring.length})`}
            </label>
            <Select
              value={filterRute}
              onValueChange={(val) => setFilterRute(val)}
            >
              <SelectTrigger size="sm" className="w-full font-mono text-copy-13">
                <SelectValue placeholder="Pilih Rute" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">
                  {filterPetugas !== 'all' ? 'Semua Rute Petugas' : 'Pilih Rute'}
                </SelectItem>
                {ruteTersaring.map((r) => (
                  <SelectItem key={r.kode} value={r.kode} className="font-mono">
                    {r.kode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alasan Taksasi */}
          <div className="lg:col-span-3 space-y-1">
            <label className="block text-label-12 font-medium text-foreground">
              Alasan Taksasi
            </label>
            <Select
              value={alasanMasal}
              onValueChange={(val) => setAlasanMasal(val)}
            >
              <SelectTrigger size="sm" className="w-full text-copy-13">
                <SelectValue placeholder="Pilih Alasan Taksasi" />
              </SelectTrigger>
              <SelectContent position="popper">
                {ALASAN_MASAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Catatan Berita Acara */}
          <div className="lg:col-span-4 space-y-1">
            <label className="block text-label-12 font-medium text-foreground">
              Catatan / Berita Acara
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={memoMasal}
                onChange={(e) => setMemoMasal(e.target.value)}
                placeholder="No. Memo / keterangan..."
                className="h-8 text-copy-13"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchPreviewMasal()}
                disabled={previewLoading || (filterPetugas === 'all' && filterRute === 'all')}
                className="h-8 px-2.5 shrink-0"
                title="Muat ulang daftar pratinjau"
              >
                <RefreshCw className={cn('size-3.5', previewLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </div>

        {/* Baris Kontrol Kedua: Filter Belum Terbaca + Ringkasan + Tombol Eksekusi */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-4">
            <label
              htmlFor="filter-belum-baca"
              className="inline-flex items-center gap-2 text-label-12 text-foreground cursor-pointer select-none"
            >
              <Checkbox
                id="filter-belum-baca"
                checked={hanyaBelumBaca}
                onCheckedChange={(checked) => setHanyaBelumBaca(Boolean(checked))}
              />
              <span>Hanya yang belum terbaca</span>
            </label>

            {previewData && (
              <div className="flex items-center gap-3 text-label-12 text-muted-foreground tabular-nums">
                <span>
                  Terpilih:{' '}
                  <strong className="font-mono text-foreground">
                    {numberFormat.format(selectedNolgs.size)}
                  </strong>{' '}
                  / {numberFormat.format(previewData.items.length)} SL
                </span>
                <span>·</span>
                <span>
                  Total Volume:{' '}
                  <strong className="font-mono text-(--verif-v2-text)">
                    {numberFormat.format(totalVolumeTerpilih)} m³
                  </strong>
                </span>
              </div>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={submittingMasal || !previewData || selectedNolgs.size === 0}
            onClick={() => void handleSubmitMasal()}
            className="h-8 px-3.5 text-label-12 font-semibold gap-1.5"
          >
            {submittingMasal ? (
              <Spinner className="size-3.5" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            Terapkan Taksasi ({numberFormat.format(selectedNolgs.size)} SL)
          </Button>
        </div>
      </div>

      {/* 2. Tabel Pratinjau Pelanggan */}
      {previewLoading ? (
        <div className="flex h-56 w-full items-center justify-center rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 text-copy-13 text-muted-foreground">
            <Spinner className="size-4" />
            <span>Menyiapkan daftar taksasi pelanggan...</span>
          </div>
        </div>
      ) : !previewData || previewData.items.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
          <Info className="size-6 text-muted-foreground/60 mb-1.5" />
          <p className="text-label-13 font-medium text-foreground">
            {filterPetugas === 'all' && filterRute === 'all'
              ? 'Pilih Petugas atau Kode Rute di atas'
              : 'Tidak ada pelanggan yang belum terbaca pada filter ini'}
          </p>
          <p className="text-label-12 text-muted-foreground mt-0.5 max-w-md">
            Sistem otomatis menyamakan ST Awal dan ST Akhir agar stand fisik meter tidak melompat, serta menghitung Pakai (m³) dari riwayat pelanggan.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table containerClassName="max-h-[calc(100vh-310px)] overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 bg-(--table-head) shadow-[0_1px_0_0_var(--border)]">
              <TableRow>
                <TableHead className="w-10 text-center bg-(--table-head)">
                  <Checkbox
                    checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua baris"
                  />
                </TableHead>
                <TableHead className="w-14 text-right font-mono bg-(--table-head)">No.</TableHead>
                <TableHead className="w-32 bg-(--table-head)">No. Pel</TableHead>
                <TableHead className="bg-(--table-head)">Nama Pelanggan</TableHead>
                <TableHead className="bg-(--table-head)">Alamat</TableHead>
                <TableHead className="w-24 bg-(--table-head)">Rute</TableHead>
                <TableHead className="w-28 text-right bg-(--table-head)">ST Awal</TableHead>
                <TableHead className="w-28 text-right bg-(--table-head)">ST Akhir</TableHead>
                <TableHead className="w-24 text-right bg-(--table-head)">Lalu (m³)</TableHead>
                <TableHead className="w-32 text-right bg-(--table-head)">Pakai Taksasi (m³)</TableHead>
                <TableHead className="w-36 text-center bg-(--table-head)">Dasar Taksasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.items.map((item, idx) => {
                const isChecked = selectedNolgs.has(item.nolg);
                const pakaiSaatIni = ambilPakaiFinal(item);
                const diubahManual = overridePakai[item.nolg] !== undefined;
                return (
                  <TableRow
                    key={item.nolg}
                    data-state={isChecked ? 'selected' : undefined}
                    className={cn(isChecked && 'bg-(--table-selected)')}
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelectRow(item.nolg)}
                        aria-label={`Pilih ${item.nolg}`}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono text-label-12 text-muted-foreground tabular-nums">
                      {numberFormat.format(idx + 1)}
                    </TableCell>
                    <TableCell className="font-mono text-copy-13 font-medium text-foreground">
                      {item.nolg}
                    </TableCell>
                    <TableCell className="font-medium text-foreground truncate max-w-52">
                      {item.nama}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-copy-12 truncate max-w-64">
                      {item.alamat}
                    </TableCell>
                    <TableCell className="font-mono text-copy-12 text-muted-foreground">
                      {item.ruteKode ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-right tabular-nums text-muted-foreground">
                      {numberFormat.format(item.stml)}
                    </TableCell>
                    <TableCell
                      className="font-mono text-right tabular-nums font-medium text-foreground"
                      title="Dikunci sama dengan ST Awal (ST Awal = ST Akhir)"
                    >
                      {numberFormat.format(item.stml)}
                    </TableCell>
                    <TableCell className="font-mono text-right tabular-nums text-muted-foreground">
                      {numberFormat.format(item.pakaiLalu)}
                    </TableCell>
                    <TableCell className="p-1.5 text-right">
                      <Input
                        type="number"
                        min={0}
                        value={pakaiSaatIni}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setOverridePakai((prev) => ({
                            ...prev,
                            [item.nolg]: val,
                          }));
                        }}
                        className={cn(
                          'ml-auto h-7 w-24 text-right font-mono text-copy-13 font-semibold tabular-nums',
                          diubahManual && 'text-(--verif-correction) border-(--verif-correction-border)'
                        )}
                        aria-label={`Pakai taksasi ${item.nolg}`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center rounded-md bg-(--ds-gray-100) px-2 py-0.5 text-label-11 text-(--ds-gray-900) ring-1 ring-inset ring-(--ds-gray-400)">
                        {diubahManual
                          ? 'Koreksi Manual'
                          : item.pakaiLalu > 0
                            ? 'Histori Lalu'
                            : 'Min. Perdir (5 m³)'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
