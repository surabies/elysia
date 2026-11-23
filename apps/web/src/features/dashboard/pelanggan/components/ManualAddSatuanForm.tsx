'use client';

import * as React from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Gauge,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { LABEL_KONDISI_CATAT } from '@/components/tanstacktable';
import { cn } from '@/lib/utils';
import { manualAddApi } from '../api';

const numberFormat = new Intl.NumberFormat('id-ID');

export interface PelangganSearchResult {
  id: string;
  nomorLangganan: string;
  nama: string;
  nolg: string;
  alamat: string;
  ruteKode?: string | null;
  tarifKode: string | null;
  tarifNama: string | null;
  noMeter: string | null;
  standTerakhir: number | null;
  pakaiTerakhir?: number | null;
  standAkhirSaatIni?: number | null;
  pakaiSaatIni?: number | null;
  ketCatatSaatIni?: string | null;
  laporanId: string | null;
  statusVerifikasi: string | null;
  sudahAdaLaporan?: boolean;
  bolehTimpaLaporan?: boolean;
}

export const KONDISI_CATAT_MANUAL_OPTIONS = [
  { value: 'NORMAL', label: LABEL_KONDISI_CATAT.NORMAL ?? 'Normal', modeDefault: 'riil' },
  {
    value: 'STAND_KONSUMEN',
    label: LABEL_KONDISI_CATAT.STAND_KONSUMEN ?? 'Stand Konsumen',
    modeDefault: 'riil',
  },
  {
    value: 'STAND_TEMPEL',
    label: LABEL_KONDISI_CATAT.STAND_TEMPEL ?? 'Stand Tempel',
    modeDefault: 'riil',
  },
  { value: 'DK', label: LABEL_KONDISI_CATAT.DK ?? 'DK', modeDefault: 'taksasi' },
  {
    value: 'TERHALANG',
    label: LABEL_KONDISI_CATAT.TERHALANG ?? 'Terhalang',
    modeDefault: 'taksasi',
  },
  {
    value: 'RUMAH_KOSONG',
    label: LABEL_KONDISI_CATAT.RUMAH_KOSONG ?? 'Rumah Kosong',
    modeDefault: 'taksasi',
  },
  {
    value: 'METER_RUSAK',
    label: LABEL_KONDISI_CATAT.METER_RUSAK ?? 'Meter Rusak',
    modeDefault: 'taksasi',
  },
  {
    value: 'METER_MATI_ADA_AIR',
    label: LABEL_KONDISI_CATAT.METER_MATI_ADA_AIR ?? 'Meter Mati',
    modeDefault: 'taksasi',
  },
  {
    value: 'METER_DALAM_AIR',
    label: LABEL_KONDISI_CATAT.METER_DALAM_AIR ?? 'Meter Dalam Air',
    modeDefault: 'taksasi',
  },
  {
    value: 'ADA_ANJING',
    label: LABEL_KONDISI_CATAT.ADA_ANJING ?? 'Ada Anjing',
    modeDefault: 'taksasi',
  },
  {
    value: 'TIDAK_DIPAKAI',
    label: LABEL_KONDISI_CATAT.TIDAK_DIPAKAI ?? 'Tidak Dipakai',
    modeDefault: 'riil',
  },
  {
    value: 'TIDAK_ADA_AIR',
    label: LABEL_KONDISI_CATAT.TIDAK_ADA_AIR ?? 'Tidak ada air',
    modeDefault: 'riil',
  },
] as const;

interface ManualAddSatuanFormProps {
  periode: string;
  onSuccess: () => void;
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void;
}

export function ManualAddSatuanForm({
  periode,
  onSuccess,
  setNotification,
}: ManualAddSatuanFormProps) {
  const [searchNomor, setSearchNomor] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<PelangganSearchResult[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = React.useState<PelangganSearchResult | null>(null);

  // Default Mode = Mode Stand Riil, Ket Catat = NORMAL (data susulan yang angka stand akhir meternya diketahui)
  const [modeInput, setModeInput] = React.useState<'taksasi' | 'riil'>('riil');
  const [standAwal, setStandAwal] = React.useState<number>(0);
  const [standAkhir, setStandAkhir] = React.useState<string>('0');
  const [pakaiManual, setPakaiManual] = React.useState<string>('0');
  const [kondisiCatat, setKondisiCatat] = React.useState<string>('NORMAL');
  const [catatanDetail, setCatatanDetail] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  const stmaNumber = modeInput === 'taksasi' ? standAwal : Number(standAkhir) || 0;
  const pakaiNumber =
    modeInput === 'taksasi'
      ? Math.max(0, Number(pakaiManual) || 0)
      : pakaiManual !== ''
        ? Number(pakaiManual)
        : Math.max(0, stmaNumber - standAwal);
  const isStandMundur = modeInput === 'riil' && standAkhir !== '' && stmaNumber < standAwal;

  const terapkanPelanggan = React.useCallback(
    (pel: PelangganSearchResult, sinkronInput = false) => {
      setSelectedPelanggan(pel);
      if (sinkronInput) {
        setSearchNomor(pel.nomorLangganan);
      }
      setSearchResults([]);
      const lastStand = Number(pel.standTerakhir ?? 0);
      const estPakai =
        pel.pakaiTerakhir != null && pel.pakaiTerakhir > 0
          ? Math.ceil(pel.pakaiTerakhir)
          : 5;

      // Stand Awal diambil dari stand akhir periode sebelumnya (data master, dikunci read-only)
      setStandAwal(lastStand);

      // Sesuaikan berdasarkan kondisi/mode saat ini (default Mode Stand Riil)
      const optSaatIni = KONDISI_CATAT_MANUAL_OPTIONS.find((o) => o.value === kondisiCatat);
      const targetMode = optSaatIni ? optSaatIni.modeDefault : 'riil';
      setModeInput(targetMode);

      if (targetMode === 'taksasi') {
        setStandAkhir(String(lastStand));
        setPakaiManual(String(estPakai));
      } else {
        const stAkhirDefault =
          pel.standAkhirSaatIni != null && pel.standAkhirSaatIni >= lastStand
            ? pel.standAkhirSaatIni
            : lastStand;
        const pakaiDefault =
          pel.pakaiSaatIni != null && pel.pakaiSaatIni >= 0
            ? pel.pakaiSaatIni
            : Math.max(0, stAkhirDefault - lastStand);
        setStandAkhir(String(stAkhirDefault));
        setPakaiManual(String(pakaiDefault));
      }
    },
    [kondisiCatat]
  );

  // Reset form secara instan saat input pencarian dihapus atau diganti ke nomor pelanggan lain
  const handleSearchInputChange = (val: string) => {
    setSearchNomor(val);
    const trimmed = val.trim().toLowerCase();

    if (!trimmed) {
      setSelectedPelanggan(null);
      setSearchResults([]);
      setStandAwal(0);
      setStandAkhir('0');
      setPakaiManual('0');
      return;
    }

    if (
      selectedPelanggan &&
      trimmed !== selectedPelanggan.nomorLangganan.toLowerCase() &&
      trimmed !== `${selectedPelanggan.nomorLangganan} - ${selectedPelanggan.nama}`.toLowerCase()
    ) {
      setSelectedPelanggan(null);
      setStandAwal(0);
      setStandAkhir('0');
      setPakaiManual('0');
    }
  };

  const handleCariPelanggan = React.useCallback(
    async (query: string) => {
      const q = query.trim();
      if (!q || q.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const list: PelangganSearchResult[] = await manualAddApi.cariPelanggan(q, periode);
        if (Array.isArray(list)) {
          const exactMatch = list.find(
            (p) => p.nomorLangganan.toLowerCase() === q.toLowerCase()
          );

          // Otomatis memunculkan & memilih data pelanggan tanpa harus klik lagi
          // bila nomor pelanggan cocok persis atau hasil pencarian tunggal
          if (exactMatch) {
            terapkanPelanggan(exactMatch, false);
          } else if (list.length === 1) {
            terapkanPelanggan(list[0], false);
          } else {
            setSearchResults(list);
          }
        }
      } catch (err) {
        console.error('Failed to search customer:', err);
      } finally {
        setSearchLoading(false);
      }
    },
    [periode, terapkanPelanggan]
  );

  React.useEffect(() => {
    const q = searchNomor.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    if (
      selectedPelanggan &&
      (q.toLowerCase() === selectedPelanggan.nomorLangganan.toLowerCase() ||
        q.toLowerCase() ===
          `${selectedPelanggan.nomorLangganan} - ${selectedPelanggan.nama}`.toLowerCase())
    ) {
      return;
    }

    const timer = setTimeout(() => {
      void handleCariPelanggan(q);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchNomor, selectedPelanggan, handleCariPelanggan]);

  const ubahMode = (modeBaru: 'taksasi' | 'riil') => {
    setModeInput(modeBaru);
    if (modeBaru === 'taksasi') {
      setStandAkhir(String(standAwal));
      const estPakai =
        selectedPelanggan?.pakaiTerakhir && selectedPelanggan.pakaiTerakhir > 0
          ? Math.ceil(selectedPelanggan.pakaiTerakhir)
          : Number(pakaiManual) > 0
            ? Number(pakaiManual)
            : 5;
      setPakaiManual(String(estPakai));
    } else {
      const stmaNum = Number(standAkhir) || standAwal;
      setPakaiManual(String(Math.max(0, stmaNum - standAwal)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPelanggan) {
      setNotification({ type: 'error', message: 'Silakan pilih pelanggan terlebih dahulu.' });
      return;
    }
    if (isStandMundur) {
      setNotification({
        type: 'error',
        message: 'Stand akhir tidak boleh lebih kecil dari stand awal.',
      });
      return;
    }
    if (!Number.isInteger(pakaiNumber) || pakaiNumber < 0) {
      setNotification({
        type: 'error',
        message: 'Pemakaian (m³) harus bilangan bulat minimal 0.',
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    const labelKondisi = LABEL_KONDISI_CATAT[kondisiCatat] ?? kondisiCatat;
    const fullCatatan = catatanDetail.trim()
      ? `[Manual ADD - ${labelKondisi}] ${catatanDetail.trim()}`
      : `[Manual ADD - ${labelKondisi}]`;

    try {
      const json = await manualAddApi.submitSatuan({
        pelangganId: selectedPelanggan.nomorLangganan,
        periode: Number(periode),
        standAwal,
        standAkhir: stmaNumber,
        pemakaian: pakaiNumber,
        kondisiCatat,
        alasanManual: fullCatatan,
      });

      if (json.success) {
        setNotification({
          type: 'success',
          message: `Tersimpan: ${selectedPelanggan.nama} (${selectedPelanggan.nomorLangganan}) — Ket Catat: ${labelKondisi}, ST ${numberFormat.format(standAwal)} → ${numberFormat.format(stmaNumber)}, Pakai ${numberFormat.format(pakaiNumber)} m³.`,
        });
        setSelectedPelanggan(null);
        setSearchNomor('');
        setStandAwal(0);
        setStandAkhir('0');
        setPakaiManual('0');
        setKondisiCatat('NORMAL');
        setModeInput('riil');
        setCatatanDetail('');
        onSuccess();
      } else {
        setNotification({
          type: 'error',
          message: json.error?.message || 'Gagal menyimpan catatan Manual ADD.',
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Kolom Kiri: Pencarian & Identitas Pelanggan */}
      <div className="lg:col-span-5 flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="border-b border-border pb-2.5">
          <h3 className="text-label-13 font-semibold text-foreground">
            1. Cari & Pilih Pelanggan
          </h3>
          <p className="text-label-12 text-muted-foreground mt-0.5">
            Ketik Nomor Langganan (NOLG) atau Nama — data otomatis dimuat saat nomor cocok.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Ketik no. langganan atau nama pelanggan..."
            value={searchNomor}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-copy-13 font-mono"
          />
          {searchLoading ? (
            <Spinner className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
          ) : searchNomor ? (
            <button
              type="button"
              onClick={() => handleSearchInputChange('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <X className="size-4" />
            </button>
          ) : null}

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg text-copy-13">
              {searchResults.map((pel) => (
                <button
                  key={pel.id}
                  type="button"
                  onClick={() => terapkanPelanggan(pel, true)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-label-12 font-semibold text-foreground">
                        {pel.nomorLangganan}
                      </span>
                      <span className="truncate font-medium text-foreground">
                        {pel.nama}
                      </span>
                    </div>
                    <p className="truncate text-label-11 text-muted-foreground">
                      {pel.alamat}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-mono text-label-11">
                    <span className="block text-muted-foreground">
                      ST: {numberFormat.format(pel.standTerakhir ?? 0)}
                    </span>
                    {pel.pakaiTerakhir != null && (
                      <span className="text-(--verif-v2-text)">
                        Lalu: {numberFormat.format(pel.pakaiTerakhir)} m³
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPelanggan ? (
          <div className="mt-1 flex flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-3.5 text-copy-13">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="size-3.5 text-(--verif-v3)" />
                  <span className="font-mono text-label-12 font-semibold text-foreground">
                    {selectedPelanggan.nomorLangganan}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-label-14 font-semibold text-foreground">
                  {selectedPelanggan.nama}
                </p>
                <p className="text-label-12 text-muted-foreground">
                  {selectedPelanggan.alamat || '—'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="shrink-0 rounded-md border border-border font-mono text-label-11"
              >
                Tarif {selectedPelanggan.tarifKode ?? '—'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border pt-2.5 text-label-12">
              <div className="rounded-md bg-card px-2.5 py-1.5 border border-border/60">
                <span className="block text-label-11 text-muted-foreground">Rute</span>
                <span className="font-mono font-semibold text-foreground">
                  {selectedPelanggan.ruteKode ?? '—'}
                </span>
              </div>
              <div className="rounded-md bg-card px-2.5 py-1.5 border border-border/60">
                <span className="block text-label-11 text-muted-foreground">ST Terakhir</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {numberFormat.format(selectedPelanggan.standTerakhir ?? 0)}
                </span>
              </div>
              <div className="rounded-md bg-card px-2.5 py-1.5 border border-border/60">
                <span className="block text-label-11 text-muted-foreground">Pakai Lalu</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {numberFormat.format(selectedPelanggan.pakaiTerakhir ?? 0)} m³
                </span>
              </div>
            </div>

            {selectedPelanggan.sudahAdaLaporan && (
              <p className="rounded-md bg-(--verif-v1-soft) px-2.5 py-1.5 text-label-11 text-(--verif-v1-text) ring-1 ring-inset ring-(--verif-v1-border)">
                Pelanggan ini sudah memiliki laporan pada periode {periode}. Menyimpan form ini akan memperbarui data laporan tersebut.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            <Gauge className="size-6 opacity-40 mb-1.5" />
            <p className="text-label-12 font-medium text-foreground">
              Belum ada pelanggan dipilih
            </p>
            <p className="text-label-11 mt-0.5">
              Ketik nomor pelanggan di atas untuk memuat ST Awal dan riwayat pemakaian secara otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Kolom Kanan: Pengaturan Stand & Pemakaian */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <div>
              <h3 className="text-label-13 font-semibold text-foreground">
                2. Tentukan Stand & Pemakaian (m³)
              </h3>
              <p className="text-label-12 text-muted-foreground mt-0.5">
                Default Mode Stand Riil untuk input susulan. ST Awal diambil dari stand akhir periode lalu (master).
              </p>
            </div>

            {/* Toggle Mode Stand Riil vs Mode Taksasi */}
            <div className="inline-flex rounded-md border border-border bg-muted/50 p-0.5 text-label-12">
              <button
                type="button"
                onClick={() => ubahMode('riil')}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-medium transition-colors',
                  modeInput === 'riil'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mode Stand Riil
              </button>
              <button
                type="button"
                onClick={() => ubahMode('taksasi')}
                className={cn(
                  'rounded-sm px-2.5 py-1 font-medium transition-colors',
                  modeInput === 'taksasi'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Mode Taksasi (ST Sama)
              </button>
            </div>
          </div>

          {/* 3 Kotak Angka Utama: ST Awal (Master Read-Only), ST Akhir, Pakai (m3) */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-label-12 font-medium text-muted-foreground">
                ST Awal (STML)
              </label>
              <Input
                type="number"
                value={standAwal}
                readOnly
                disabled
                className="h-9 font-mono text-copy-13 font-semibold tabular-nums disabled:bg-muted/60 disabled:opacity-80"
              />
              <span className="block text-label-11 text-muted-foreground">
                Stand akhir periode lalu (Master)
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-label-12 font-medium text-foreground">
                ST Akhir (STMA) *
              </label>
              <Input
                type="number"
                min={0}
                disabled={modeInput === 'taksasi'}
                value={modeInput === 'taksasi' ? standAwal : standAkhir}
                onChange={(e) => {
                  const val = e.target.value;
                  setStandAkhir(val);
                  const num = Number(val);
                  if (val !== '' && Number.isFinite(num) && num >= standAwal) {
                    setPakaiManual(String(num - standAwal));
                  }
                }}
                className="h-9 font-mono text-copy-13 font-semibold tabular-nums disabled:bg-muted/60 disabled:opacity-80"
                required
              />
              <span className="block text-label-11 text-muted-foreground">
                {modeInput === 'taksasi'
                  ? 'Dikunci sama dengan ST Awal'
                  : 'Input angka stand akhir meter'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-label-12 font-semibold text-(--verif-correction)">
                Pakai / Taksasi (m³) *
              </label>
              <Input
                type="number"
                min={0}
                value={pakaiManual}
                onChange={(e) => setPakaiManual(e.target.value)}
                className="h-9 font-mono text-copy-13 font-bold tabular-nums text-(--verif-correction) border-(--verif-correction-border)"
                required
              />
              <span className="block text-label-11 text-muted-foreground">
                Otomatis dari selisih / dapat disesuaikan
              </span>
            </div>
          </div>

          {isStandMundur && (
            <div className="flex items-center gap-2 rounded-md bg-(--verif-error-soft) px-3 py-2 text-label-12 text-(--verif-error-text) ring-1 ring-inset ring-(--verif-error-border)">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Stand Akhir tidak boleh lebih kecil dari ST Awal.</span>
            </div>
          )}

          {/* Kondisi / Alasan (Ket Catat) & Catatan */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-label-12 font-medium text-foreground">
                Kondisi / Alasan (Ket Catat)
              </label>
              <Select
                value={kondisiCatat}
                onValueChange={(val) => {
                  setKondisiCatat(val);
                  const opt = KONDISI_CATAT_MANUAL_OPTIONS.find((o) => o.value === val);
                  if (opt) ubahMode(opt.modeDefault);
                }}
              >
                <SelectTrigger size="sm" className="w-full text-copy-13">
                  <SelectValue placeholder="Pilih Ket Catat" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {KONDISI_CATAT_MANUAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="block text-label-12 font-medium text-foreground">
                Catatan / Keterangan Tambahan
              </label>
              <Input
                placeholder="Mis. foto susulan via WA, pagar digembok..."
                value={catatanDetail}
                onChange={(e) => setCatatanDetail(e.target.value)}
                className="h-8 text-copy-13"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-label-12 text-muted-foreground font-mono tabular-nums">
            Ket Catat:{' '}
            <strong className="text-foreground">
              {LABEL_KONDISI_CATAT[kondisiCatat] ?? kondisiCatat}
            </strong>{' '}
            · ST <strong className="text-foreground">{numberFormat.format(standAwal)}</strong> →{' '}
            <strong className="text-foreground">{numberFormat.format(stmaNumber)}</strong> · Pakai{' '}
            <strong className="text-(--verif-correction)">{numberFormat.format(pakaiNumber)} m³</strong>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!selectedPelanggan || submitting || isStandMundur}
            className="h-8 px-4 text-label-12 font-semibold gap-1.5"
          >
            {submitting ? (
              <Spinner className="size-3.5" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Simpan Manual ADD
          </Button>
        </div>
      </form>
    </div>
  );
}
