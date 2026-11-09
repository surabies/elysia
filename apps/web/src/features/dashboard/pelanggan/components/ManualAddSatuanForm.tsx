'use client';

import * as React from 'react';
import { Search, Sparkles, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat('id-ID');

export interface PelangganSearchResult {
  id: string;
  nomorLangganan: string;
  nama: string;
  nolg: string;
  alamat: string;
  tarifKode: string | null;
  tarifNama: string | null;
  noMeter: string | null;
  standTerakhir: number | null;
  laporanId: string | null;
  statusVerifikasi: string | null;
}

export const ALASAN_OPTIONS = [
  { value: 'RUMAH_TERKUNCI', label: 'Rumah Terkunci / Pagar Digembok' },
  { value: 'METER_TERTIMBUN', label: 'Meter Tertimbun Tanah / Terhalang Puing' },
  { value: 'METER_RUSAK', label: 'Angka Meter Buram / Pecah (Darurat GWM)' },
  { value: 'PENGADUAN_KOMPLAIN', label: 'Tindak Lanjut Pengaduan Pelanggan' },
  { value: 'TAKSIRAN_RATA_RATA', label: 'Taksiran Rata-rata Pemakaian (Perdir)' },
  { value: 'KOREKSI_LAPANGAN', label: 'Catatan Khusus Lapangan / Verifikasi' },
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

  const [standAwal, setStandAwal] = React.useState<number>(0);
  const [standAkhir, setStandAkhir] = React.useState<string>('');
  const [alasanKategori, setAlasanKategori] = React.useState<string>(ALASAN_OPTIONS[0].label);
  const [catatanDetail, setCatatanDetail] = React.useState<string>('');
  const [submitting, setSubmitting] = React.useState(false);

  const stmaNumber = Number(standAkhir) || 0;
  const pemakaianM3 = Math.max(0, stmaNumber - standAwal);
  const isStandMundur = standAkhir !== '' && stmaNumber < standAwal;
  const isEkstrim = pemakaianM3 > 50;

  // Debounced search customer
  const handleCariPelanggan = React.useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/v1/manual-add/cari-pelanggan?nomor=${encodeURIComponent(query.trim())}&periode=${periode}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error('Failed to search customer:', err);
      } finally {
        setSearchLoading(false);
      }
    },
    [periode]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchNomor.trim()) {
        handleCariPelanggan(searchNomor);
      } else {
        setSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchNomor, handleCariPelanggan]);

  const handleSelectCustomer = (pel: PelangganSearchResult) => {
    setSelectedPelanggan(pel);
    setSearchResults([]);
    setSearchNomor(`${pel.nomorLangganan} - ${pel.nama}`);
    const lastStand = pel.standTerakhir ?? 0;
    setStandAwal(Number(lastStand));
    setStandAkhir(String(Number(lastStand) + 10));
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
        message: 'Stand akhir tidak boleh lebih kecil dari stand awal (meter mundur).',
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    const fullCatatan = `[Manual ADD: ${alasanKategori}] ${catatanDetail.trim()}`.trim();

    try {
      const res = await fetch('/api/v1/manual-add/satuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pelangganId: selectedPelanggan.nomorLangganan,
          periode: Number(periode),
          standAwal,
          standAkhir: stmaNumber,
          pemakaian: pemakaianM3,
          alasanManual: fullCatatan,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotification({
          type: 'success',
          message: `Berhasil mencatat Stand Manual ADD untuk ${selectedPelanggan.nama} (${selectedPelanggan.nomorLangganan}) sebesar ${pemakaianM3} m³.`,
        });
        setSelectedPelanggan(null);
        setSearchNomor('');
        setStandAkhir('');
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
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-label-14 font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Formulir Entri Stand Manual ADD Satuan
            </CardTitle>
            <CardDescription className="text-copy-13 mt-0.5">
              Cari pelanggan dan masukkan stand meter darurat dengan berita acara resmi.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase font-mono">
            {periode}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Box */}
          <div className="relative space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-label-12 font-medium text-foreground">Pencarian Pelanggan (NOLG / Nama)</span>
              <span className="text-label-11 text-muted-foreground">Ketik minimal 2 karakter</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Contoh: 00302600011 atau nama pelanggan..."
                value={searchNomor}
                onChange={(e) => setSearchNomor(e.target.value)}
                className="pl-9 h-9 text-copy-13"
              />
              {searchLoading && (
                <Spinner className="absolute right-3 top-2.5 size-4 text-primary" />
              )}
            </div>

            {/* Dropdown Suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg text-copy-13">
                {searchResults.map((pel) => (
                  <div
                    key={pel.id}
                    onClick={() => handleSelectCustomer(pel)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{pel.nomorLangganan}</span>
                        <span className="font-medium text-foreground">{pel.nama}</span>
                      </div>
                      <p className="text-label-11 text-muted-foreground truncate max-w-sm">{pel.alamat}</p>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[11px]">
                      <span className="text-muted-foreground block text-[10px]">Stand Lalu</span>
                      <span className="font-semibold text-foreground">{numberFormat.format(pel.standTerakhir ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Card */}
          {selectedPelanggan && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-copy-13 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary uppercase">
                    NOLG: {selectedPelanggan.nomorLangganan}
                  </span>
                  <h4 className="font-bold text-foreground text-sm mt-0.5">{selectedPelanggan.nama}</h4>
                  <p className="text-muted-foreground text-label-12">{selectedPelanggan.alamat}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Tarif {selectedPelanggan.tarifKode ?? '-'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 border-t border-primary/20 pt-2 text-label-11 text-muted-foreground font-mono">
                <span>No. Meter: <strong className="text-foreground">{selectedPelanggan.noMeter ?? '-'}</strong></span>
                <span>Stand Terakhir: <strong className="text-foreground">{numberFormat.format(selectedPelanggan.standTerakhir ?? 0)}</strong></span>
              </div>
            </div>
          )}

          {/* Sizing & Stand Inputs */}
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/20 p-3.5">
            <div>
              <label className="text-label-11 font-medium text-muted-foreground block mb-1">
                Stand Lalu (STML)
              </label>
              <Input
                type="number"
                value={standAwal}
                onChange={(e) => setStandAwal(Number(e.target.value))}
                className="font-mono text-sm font-semibold h-9"
                required
              />
            </div>

            <div>
              <label className="text-label-11 font-medium text-foreground block mb-1">
                Stand Akhir Baru (STMA) *
              </label>
              <Input
                type="number"
                value={standAkhir}
                onChange={(e) => setStandAkhir(e.target.value)}
                placeholder="Contoh: 1540"
                className="font-mono text-sm font-bold h-9 border-primary/50 focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col justify-between">
              <span className="text-label-11 font-medium text-muted-foreground block mb-1">
                Pemakaian Air
              </span>
              <div className="flex items-center h-9 px-3 rounded-md bg-card border border-border font-mono font-bold text-sm text-primary">
                {numberFormat.format(pemakaianM3)} m³
              </div>
            </div>
          </div>

          {isStandMundur && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-label-12 text-destructive font-medium">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Peringatan: Stand Akhir lebih kecil dari Stand Lalu (Meter Mundur).</span>
            </div>
          )}
          {isEkstrim && !isStandMundur && (
            <div className="flex items-center gap-2 rounded-md bg-amber-500/10 p-2 text-label-12 text-amber-600 font-medium">
              <Info className="size-4 shrink-0" />
              <span>Catatan: Pemakaian mencapai {pemakaianM3} m³ (tergolong tinggi).</span>
            </div>
          )}

          {/* NativeSelect from shadcn/ui */}
          <div className="space-y-1.5">
            <label className="text-label-12 font-medium text-foreground">
              Alasan & Kategori Manual ADD *
            </label>
            <NativeSelect
              value={alasanKategori}
              onChange={(e) => setAlasanKategori(e.target.value)}
              size="md"
              className="w-full"
              required
            >
              {ALASAN_OPTIONS.map((opt) => (
                <NativeSelectOption key={opt.value} value={opt.label}>
                  {opt.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* Textarea from shadcn/ui */}
          <div className="space-y-1.5">
            <label className="text-label-12 font-medium text-foreground">
              Catatan Tambahan & Nomor Berita Acara
            </label>
            <Textarea
              value={catatanDetail}
              onChange={(e) => setCatatanDetail(e.target.value)}
              placeholder="Tuliskan nomor memo, nama saksi lapangan, atau penjelasan teknis..."
              rows={3}
              className="min-h-20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => {
                setSelectedPelanggan(null);
                setSearchNomor('');
                setStandAkhir('');
                setCatatanDetail('');
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedPelanggan || isStandMundur}
              size="default"
              className="gap-1.5 font-semibold"
            >
              {submitting && <Spinner className="size-3.5" />}
              Simpan & Terbitkan Manual ADD
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
