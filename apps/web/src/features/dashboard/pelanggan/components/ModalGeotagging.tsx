'use client';

import * as React from 'react';
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
  AlertTriangle,
  Loader2,
  Crosshair,
} from 'lucide-react';
import { toast } from 'sonner';
import { pelangganApi } from '../api';
import type { PelangganGpsItem } from '../types';

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
  const [lat, setLat] = React.useState('');
  const [lng, setLng] = React.useState('');
  const [catatan, setCatatan] = React.useState('');
  const [gettingLocation, setGettingLocation] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Sinkronkan input saat dialog dibuka
  React.useEffect(() => {
    if (open && pelanggan) {
      setLat(pelanggan.lat != null ? String(pelanggan.lat) : '');
      setLng(pelanggan.lng != null ? String(pelanggan.lng) : '');
      setCatatan('');
    }
  }, [open, pelanggan]);

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

  const handleAmbilGpsPerangkat = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat atau browser tidak mendukung Geolocation API');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGettingLocation(false);
        const latitude = pos.coords.latitude.toFixed(7);
        const longitude = pos.coords.longitude.toFixed(7);
        setLat(latitude);
        setLng(longitude);
        toast.success(`Koordinat berhasil diambil (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGettingLocation(false);
        toast.error(`Gagal mendapatkan lokasi GPS: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
      const res = await pelangganApi.updateGps(pelanggan.nolg, {
        lat: parsedLat,
        lng: parsedLng,
        catatan: catatan.trim() || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSimpan} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-blue-subtle text-(--ds-blue-900) flex items-center justify-center shrink-0">
                <Compass className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {pelanggan.hasGps ? 'Perbarui Titik GPS' : 'Plot Titik Koordinat GPS'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Pemetaan spasial PostGIS untuk rute cater dan verifikasi lapangan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Kartu Profil Pelanggan Ringkas */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-foreground">
                NoLG: {pelanggan.nolg}
              </span>
              <Badge variant={pelanggan.hasGps ? 'green-subtle' : 'amber-subtle'} className="text-[10px]">
                {pelanggan.hasGps ? 'Sudah Ber-GPS' : 'Belum Ada GPS'}
              </Badge>
            </div>
            <div className="font-medium text-foreground">{pelanggan.nama}</div>
            <div className="text-muted-foreground truncate">
              {pelanggan.alamat} {pelanggan.rt ? `RT ${pelanggan.rt}` : ''} {pelanggan.rw ? `/ RW ${pelanggan.rw}` : ''}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground pt-0.5 border-t border-border/50">
              <span>Rute: <span className="font-mono text-foreground">{pelanggan.ruteKode || '-'}</span></span>
              <span>No. Urut: <span className="font-mono text-foreground">{pelanggan.noUrutRute ?? '-'}</span></span>
              <span>No. Meter: <span className="font-mono text-foreground">{pelanggan.noMeter || '-'}</span></span>
            </div>
          </div>

          {/* Form Input Koordinat */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Koordinat Geografis (WGS84 / PostGIS)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleAmbilGpsPerangkat}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Crosshair className="size-3.5 text-blue-600" />
                )}
                <span>Ambil GPS Perangkat</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="gps-lat" className="text-[11px] text-muted-foreground">
                  Latitude (Lintang)
                </Label>
                <Input
                  id="gps-lat"
                  type="number"
                  step="any"
                  placeholder="-6.914744"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="font-mono text-xs h-9"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gps-lng" className="text-[11px] text-muted-foreground">
                  Longitude (Bujur)
                </Label>
                <Input
                  id="gps-lng"
                  type="number"
                  step="any"
                  placeholder="107.609810"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="font-mono text-xs h-9"
                  required
                />
              </div>
            </div>

            {/* Google Maps External Verification Link */}
            {isValidCoord && (
              <div className="flex items-center justify-between p-2 rounded bg-muted/60 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5 text-green-600" />
                  <span>Titik valid terdeteksi</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <span>Buka di Google Maps</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="gps-catatan" className="text-[11px] text-muted-foreground">
                Keterangan / Patokan Lapangan (Opsional)
              </Label>
              <Input
                id="gps-catatan"
                placeholder="Contoh: Rumah pagar hitam, depan gardu PLN..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={saving || !isValidCoord}
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
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
