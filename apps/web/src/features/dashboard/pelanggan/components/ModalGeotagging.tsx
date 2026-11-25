'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Compass,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Crosshair,
  ClipboardPaste,
  Sparkles,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavOptional } from '@/components/layout';
import { pelangganApi } from '../api';
import type { PelangganGpsItem } from '../types';
import { PetaPinpointGps } from './PetaPinpointGps';
import { parseClipboardCoordinates } from '../utils/coordParser';

interface GpsSample {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Menghitung rata-rata berbobot (Weighted Centroid) berdasarkan 1 / accuracy^2
 * sehingga sampel dengan akurasi paling tajam memiliki bobot paling besar.
 */
function computeWeightedGps(samples: GpsSample[]): GpsSample {
  if (samples.length === 1) return samples[0]!;
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  let bestAcc = Infinity;

  for (const s of samples) {
    const safeAcc = Math.max(s.accuracy, 1);
    const weight = 1 / (safeAcc * safeAcc);
    weightedLat += s.lat * weight;
    weightedLng += s.lng * weight;
    totalWeight += weight;
    if (s.accuracy < bestAcc) bestAcc = s.accuracy;
  }

  return {
    lat: Number((weightedLat / totalWeight).toFixed(7)),
    lng: Number((weightedLng / totalWeight).toFixed(7)),
    accuracy: Math.round(bestAcc),
  };
}

export function ModalGeotagging({
  pelanggan,
  open,
  onOpenChange,
  onSuccess,
}: {
  pelanggan: PelangganGpsItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const isMobile = useIsMobile();
  const mobileNav = useMobileNavOptional();
  const [lat, setLat] = React.useState('');
  const [lng, setLng] = React.useState('');
  const [catatan, setCatatan] = React.useState('');
  const [accuracy, setAccuracy] = React.useState<number | null>(null);
  const [sampleCount, setSampleCount] = React.useState(0);
  const [gettingLocation, setGettingLocation] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isSnapped, setIsSnapped] = React.useState(false);
  const [snapDistance, setSnapDistance] = React.useState<number | null>(null);

  const watchIdRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopWatchGps = React.useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== 'undefined' &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Sinkronkan input saat dialog dibuka & bersihkan watcher saat ditutup
  React.useEffect(() => {
    if (open && pelanggan) {
      setLat(pelanggan.lat != null ? String(pelanggan.lat) : '');
      setLng(pelanggan.lng != null ? String(pelanggan.lng) : '');
      setCatatan('');
      setAccuracy(null);
      setSampleCount(0);
      setIsSnapped(false);
      setSnapDistance(null);
    } else {
      stopWatchGps();
      setGettingLocation(false);
    }
    return () => stopWatchGps();
  }, [open, pelanggan, stopWatchGps]);

  // Sembunyikan floating bar menu navigasi mobile saat modal/sheet peta terbuka
  React.useEffect(() => {
    if (isMobile && open && mobileNav) {
      mobileNav.setIsFloatingBarHidden(true);
      return () => {
        mobileNav.setIsFloatingBarHidden(false);
      };
    }
  }, [isMobile, open, mobileNav]);

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const isValidCoord =
    !isNaN(parsedLat) &&
    !isNaN(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180 &&
    lat.trim() !== '' &&
    lng.trim() !== '';

  /**
   * Metode Enterprise Multi-Sample GPS Averaging:
   * Mengumpulkan hingga 5 sampel GPS beruntun selama maks 4.5 detik menggunakan watchPosition,
   * membuang loncatan awal (cold-start drift), dan menghitung rata-rata berbobot.
   */
  const handleKalibrasiGpsPresisi = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat atau browser tidak mendukung Geolocation API');
      return;
    }

    stopWatchGps();
    setGettingLocation(true);
    setSampleCount(0);

    const samples: GpsSample[] = [];
    const TARGET_SAMPLES = 5;

    const finishSampling = () => {
      stopWatchGps();
      setGettingLocation(false);
      if (samples.length > 0) {
        const result = computeWeightedGps(samples);
        setLat(result.lat.toFixed(7));
        setLng(result.lng.toFixed(7));
        setAccuracy(result.accuracy);
        toast.success(
          `Kalibrasi GPS selesai dari ${samples.length} sampel (Akurasi: ±${result.accuracy}m). Geser peta jika perlu koreksi.`
        );
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const sample: GpsSample = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        samples.push(sample);
        setSampleCount(samples.length);

        const interim = computeWeightedGps(samples);
        setLat(interim.lat.toFixed(7));
        setLng(interim.lng.toFixed(7));
        setAccuracy(interim.accuracy);

        if (
          samples.length >= TARGET_SAMPLES ||
          (samples.length >= 2 && pos.coords.accuracy <= 4)
        ) {
          finishSampling();
        }
      },
      (err) => {
        stopWatchGps();
        setGettingLocation(false);
        toast.error(`Gagal membaca sensor GPS: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );

    timerRef.current = setTimeout(() => {
      if (samples.length > 0) {
        finishSampling();
      }
    }, 4500);
  };

  const handlePasteKoordinat = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseClipboardCoordinates(text);
      if (parsed) {
        const pastedLat = String(parsed.lat);
        const pastedLng = String(parsed.lng);
        setLat(pastedLat);
        setLng(pastedLng);
        setAccuracy(null);
        setIsSnapped(false);

        let descMsg = 'Peta otomatis dipusatkan ke titik koordinat dari clipboard Anda.';
        if (parsed.format === 'swapped-decimal') {
          descMsg = 'Format terdeteksi bujur-lintang terbalik dan telah otomatis disesuaikan.';
        } else if (parsed.format === 'url') {
          descMsg = 'Koordinat berhasil diekstrak langsung dari tautan/URL Google Maps.';
        } else if (parsed.format === 'dms') {
          descMsg = 'Format Derajat Menit Detik (DMS) berhasil dikonversi ke desimal.';
        }

        toast.success(`Koordinat ditempel: ${pastedLat}, ${pastedLng}`, {
          description: descMsg,
        });
      } else {
        toast.error('Format koordinat di clipboard tidak dikenali', {
          description:
            'Salin teks dari Google Maps (contoh: -6.914744, 107.609810 atau link URL Google Maps atau format DMS 6°54\'53.1"S 107°36\'35.3"E).',
        });
      }
    } catch {
      toast.error('Tidak dapat mengakses clipboard browser', {
        description: 'Pastikan izin akses papan klip (clipboard) diizinkan pada pengaturan browser Anda.',
      });
    }
  };

  const handleResetAwal = () => {
    if (pelanggan?.lat != null && pelanggan?.lng != null) {
      setLat(String(pelanggan.lat));
      setLng(String(pelanggan.lng));
      setAccuracy(null);
    }
  };

  const handleMapCoordChange = (
    newLat: number,
    newLng: number,
    meta?: { isSnapped?: boolean; snapDistance?: number }
  ) => {
    setLat(String(newLat));
    setLng(String(newLng));
    if (meta?.isSnapped) {
      setIsSnapped(true);
      setSnapDistance(meta.snapDistance ?? null);
    } else {
      setIsSnapped(false);
      setSnapDistance(null);
    }
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelanggan) return;

    if (!isValidCoord) {
      toast.error('Format koordinat tidak valid. Pastikan Latitude (-90 s/d 90) dan Longitude (-180 s/d 180) terisi angka.');
      return;
    }

    try {
      setSaving(true);
      const snapNote = isSnapped && snapDistance !== null
        ? `[Snapped Muka Persil ±${snapDistance.toFixed(1)}m]`
        : '';
      const mergedCatatan = [catatan.trim(), snapNote].filter(Boolean).join(' ');

      const res = await pelangganApi.updateGps(pelanggan.nolg, {
        lat: parsedLat,
        lng: parsedLng,
        catatan: mergedCatatan || undefined,
      });

      toast.success(res.message || 'Titik koordinat GPS berhasil disimpan');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan koordinat GPS');
    } finally {
      setSaving(false);
    }
  };

  if (!pelanggan) return null;

  const titleText = pelanggan.hasGps
    ? 'Perbarui & Kalibrasi Titik GPS'
    : 'Plot & Kalibrasi Titik GPS';

  // =========================================================================
  // TAMPILAN KHUSUS MOBILE: FULL-SCREEN NATIVE MOBILE APP SHEET (Seperti Gojek/Grab Pinpoint)
  // =========================================================================
  if (isMobile) {
    if (!open) return null;

    const mobileContent = (
      <div className="fixed inset-0 z-[60] flex flex-col bg-background animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
        {/* 1. Native App Top Bar */}
        <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-full flex items-center justify-center text-foreground hover:bg-(--ds-gray-100) active:scale-95 transition-transform"
            aria-label="Kembali"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-label-12 font-bold text-foreground">
                {pelanggan.nolg}
              </span>
              <Badge variant="gray-subtle" size="sm" className="font-mono">
                Rute {pelanggan.ruteKode || '-'} #{pelanggan.noUrutRute ?? '-'}
              </Badge>
            </div>
            <p className="text-label-13 font-semibold text-foreground truncate">
              {pelanggan.nama}
            </p>
          </div>

          {isValidCoord && (
            <a
              href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
              target="_blank"
              rel="noreferrer"
              className="h-8 px-2.5 rounded-md border border-border bg-card text-label-12 text-(--ds-blue-700) font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>Maps</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </header>

        {isSnapped && (
          <div className="px-3 py-1 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-300 shrink-0">
            <span className="flex items-center gap-1 font-semibold">
              🧲 Terkunci Garis Muka Persil
            </span>
            <span>Koreksi: &plusmn;{snapDistance?.toFixed(1)}m</span>
          </div>
        )}

        {/* 2. Area Peta Satelit Utama (Mengisi Sebagian Besar Layar Mobile) */}
        <div className="flex-1 min-h-0 p-2.5 flex flex-col">
          <PetaPinpointGps
            lat={isValidCoord ? parsedLat : null}
            lng={isValidCoord ? parsedLng : null}
            accuracy={accuracy}
            mapHeightClassName="flex-1 min-h-[240px]"
            onChange={handleMapCoordChange}
            onRecenterGps={handleKalibrasiGpsPresisi}
          />
        </div>

        {/* 3. Bottom Control Deck (Kartu Kontrol Bawah ala Aplikasi Mobile) */}
        <form
          onSubmit={handleSimpan}
          className="shrink-0 rounded-t-2xl border-t border-border bg-card px-4 pt-3 pb-5 shadow-lg space-y-3"
        >
          {/* Baris Tombol Kalibrasi GPS & Status Akurasi */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1 h-10 justify-center gap-2 font-medium border-(--ds-blue-300) bg-(--ds-blue-100) text-(--ds-blue-900)"
              onClick={handleKalibrasiGpsPresisi}
              disabled={gettingLocation || saving}
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Kalibrasi GPS ({sampleCount}/5)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-(--ds-blue-700)" />
                  <span>Ambil &amp; Kalibrasi GPS HP</span>
                </>
              )}
            </Button>

            {accuracy !== null && (
              <Badge
                variant={
                  accuracy <= 8
                    ? 'green-subtle'
                    : accuracy <= 20
                    ? 'amber-subtle'
                    : 'red-subtle'
                }
                size="lg"
                className="h-10 px-2.5 shrink-0"
              >
                ±{accuracy}m
              </Badge>
            )}
          </div>

          {/* Input Koordinat & Catatan Ringkas */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="m-lat" className="text-label-11 text-muted-foreground">
                Latitude
              </Label>
              <Input
                id="m-lat"
                type="number"
                inputMode="decimal"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="-6.914744"
                className="font-mono text-copy-13 h-9 mt-0.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="m-lng" className="text-label-11 text-muted-foreground">
                Longitude
              </Label>
              <Input
                id="m-lng"
                type="number"
                inputMode="decimal"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="107.609810"
                className="font-mono text-copy-13 h-9 mt-0.5"
                required
              />
            </div>
          </div>

          <Input
            placeholder="Catatan patokan lokasi (opsional, mis: pagar hitam)..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="text-copy-13 h-9"
          />

          {/* Tombol Aksi Utama Mobile */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-28 h-11"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-11 gap-2 font-semibold"
              disabled={saving || !isValidCoord}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Kunci &amp; Simpan Titik GPS</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(mobileContent, document.body);
    }
    return mobileContent;
  }

  // =========================================================================
  // TAMPILAN DESKTOP: WIDE 2-COLUMN ENTERPRISE DIALOG (sm:max-w-[960px])
  // Kiri: Peta Satelit Interaktif Lebar | Kanan: Profil, Kalibrasi & Koordinat
  // =========================================================================
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[940px] max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <form onSubmit={handleSimpan} className="space-y-4">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center justify-between gap-4 pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-heading-18">
                  <Compass className="size-5 text-(--ds-blue-700)" />
                  <span>{titleText}</span>
                </DialogTitle>
                <DialogDescription className="text-copy-13 text-muted-foreground mt-0.5">
                  Kalibrasi sinyal GPS multi-sampel atau geser peta satelit untuk mengunci titik koordinat tepat di atas meter air pelanggan.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {isSnapped && (
                  <Badge variant="green-subtle" size="md" className="font-mono">
                    🧲 Snapped Muka Persil (&plusmn;{snapDistance?.toFixed(1)}m)
                  </Badge>
                )}
                <Badge variant={pelanggan.hasGps ? 'green-subtle' : 'amber-subtle'} size="md">
                  {pelanggan.hasGps ? 'Sudah Ber-GPS' : 'Belum Ada GPS'}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Grid 2 Kolom Lebar: Kiri Peta Interaktif (7/12), Kanan Panel Kontrol (5/12) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* KOLOM KIRI: Peta Satelit & Micro-Nudge */}
            <div className="lg:col-span-7">
              <PetaPinpointGps
                lat={isValidCoord ? parsedLat : null}
                lng={isValidCoord ? parsedLng : null}
                accuracy={accuracy}
                mapHeightClassName="h-[360px]"
                onChange={handleMapCoordChange}
                onRecenterGps={handleKalibrasiGpsPresisi}
              />
            </div>

            {/* KOLOM KANAN: Identitas Pelanggan, Kalibrasi & Input Koordinat */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1. Identitas Pelanggan */}
              <div className="p-3.5 rounded-lg bg-(--ds-gray-100) border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-label-11 uppercase tracking-wider text-muted-foreground font-mono">
                    Identitas Sambungan
                  </span>
                  <span className="font-mono text-label-13 font-bold text-foreground">
                    {pelanggan.nolg}
                  </span>
                </div>
                <div className="text-heading-16 font-semibold text-foreground">
                  {pelanggan.nama}
                </div>
                <p className="text-copy-12 text-muted-foreground">
                  {pelanggan.alamat}
                  {(pelanggan.rt || pelanggan.rw) &&
                    ` (RT ${pelanggan.rt ?? '-'} / RW ${pelanggan.rw ?? '-'})`}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t border-border text-label-12">
                  <div>
                    <span className="text-muted-foreground block text-label-11">No. Urut</span>
                    <strong className="font-mono text-foreground">
                      #{pelanggan.noUrutRute ?? '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-label-11">Kode Rute</span>
                    <strong className="font-mono text-foreground">
                      {pelanggan.ruteKode || '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-label-11">No. Meter</span>
                    <strong className="font-mono text-foreground truncate block">
                      {pelanggan.noMeter || '-'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. Kalibrasi Sinyal GPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-label-13 font-medium text-foreground">
                    Kalibrasi Sensor GPS
                  </Label>
                  <div className="flex items-center gap-2.5">
                    {pelanggan.hasGps && (
                      <button
                        type="button"
                        onClick={handleResetAwal}
                        className="inline-flex items-center gap-1 text-label-12 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>Reset</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePasteKoordinat}
                      className="inline-flex items-center gap-1 text-label-12 text-(--ds-blue-700) hover:underline cursor-pointer"
                      title="Tempel teks koordinat (lat, lng) yang Anda copy dari Google Maps / WhatsApp"
                    >
                      <ClipboardPaste className="size-3" />
                      <span>Tempel Clipboard</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full justify-center gap-2 font-medium border-(--ds-blue-300) bg-(--ds-blue-100) text-(--ds-blue-900) hover:bg-(--ds-blue-200)"
                  onClick={handleKalibrasiGpsPresisi}
                  disabled={gettingLocation || saving}
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Mengambil 5 Sampel GPS ({sampleCount}/5)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 text-(--ds-blue-700)" />
                      <span>Kalibrasi GPS Presisi (Rata-rata 5 Sampel)</span>
                    </>
                  )}
                </Button>

                {accuracy !== null && (
                  <div className="flex items-center justify-between rounded-md border border-border bg-(--ds-gray-100) px-3 py-1.5 text-label-12">
                    <span className="text-muted-foreground">Estimasi Akurasi Sinyal:</span>
                    <Badge
                      variant={
                        accuracy <= 8
                          ? 'green-subtle'
                          : accuracy <= 20
                          ? 'amber-subtle'
                          : 'red-subtle'
                      }
                      size="sm"
                    >
                      ±{accuracy} meter ({accuracy <= 8 ? 'Tinggi' : accuracy <= 20 ? 'Sedang' : 'Lemah'})
                    </Badge>
                  </div>
                )}
              </div>

              {/* 3. Input Koordinat Presisi */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="gps-lat" className="text-label-12 text-muted-foreground">
                    Latitude (Lintang)
                  </Label>
                  <Input
                    id="gps-lat"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="-6.914744"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="font-mono text-copy-13 h-9"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gps-lng" className="text-label-12 text-muted-foreground">
                    Longitude (Bujur)
                  </Label>
                  <Input
                    id="gps-lng"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="107.609810"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="font-mono text-copy-13 h-9"
                    required
                  />
                </div>
              </div>

              {/* 4. Catatan Lapangan */}
              <div className="space-y-1">
                <Label htmlFor="gps-catatan" className="text-label-12 text-muted-foreground">
                  Patokan Lokasi / Catatan Lapangan (Opsional)
                </Label>
                <Input
                  id="gps-catatan"
                  placeholder="Contoh: Meter di samping pagar hitam / pos ronda..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="text-copy-13 h-9"
                />
              </div>

              {/* 5. Verifikasi Eksternal Google Maps */}
              {isValidCoord && (
                <a
                  href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-8 px-3 rounded-md border border-border bg-card hover:bg-(--ds-gray-100) inline-flex items-center justify-center gap-1.5 text-label-12 text-(--ds-blue-700) font-medium"
                >
                  <MapPin className="size-3.5" />
                  <span>Verifikasi Titik di Google Maps ({parsedLat.toFixed(5)}, {parsedLng.toFixed(5)})</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="md"
              className="gap-1.5"
              disabled={saving || !isValidCoord}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Simpan Titik GPS</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
