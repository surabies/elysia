// features/dashboard/pengaturan/components/TabCatatMeter.tsx
// Modul Tab 2: Konfigurasi Validasi Pembacaan Meter Lapangan (Cater)

'use client';

import * as React from 'react';
import { Smartphone, MapPin, Clock, Camera, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { CaterConfig } from '../types';

interface TabCatatMeterProps {
  config: CaterConfig;
  onChange: <K extends keyof CaterConfig>(key: K, value: CaterConfig[K]) => void;
}

export function TabCatatMeter({ config, onChange }: TabCatatMeterProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Parameter Validasi Pembacaan Meter Lapangan (Cater)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Konfigurasi radius geofence PostGIS, pencegahan nembak stand, dan kontrol sinkronisasi aplikasi mobile.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-5">
          {/* Grid 2 Kolom Seimbang: Geofence & Minimal Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  Radius Toleransi Geofence GPS
                </Label>
                <span className="font-mono text-xs font-semibold text-primary">
                  {config.radiusGeofence} meter
                </span>
              </div>
              <Input
                type="number"
                value={config.radiusGeofence}
                onChange={(e) => onChange('radiusGeofence', e.target.value)}
                className="font-mono text-xs h-9 w-full bg-card"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Jarak maksimal pembacaan petugas dari koordinat PostGIS meteran sebelum ditandai anomali lokasi (*anti-nembak*).
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  Batas Minimal Waktu per SL
                </Label>
                <span className="font-mono text-xs font-semibold text-primary">
                  {config.minDurasiPerSL} detik
                </span>
              </div>
              <Input
                type="number"
                value={config.minDurasiPerSL}
                onChange={(e) => onChange('minDurasiPerSL', e.target.value)}
                className="font-mono text-xs h-9 w-full bg-card"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Mencegah pengisian borongan secara instan di satu titik oleh petugas lapangan (*anti-speedrun* rute).
              </p>
            </div>
          </div>

          {/* Toggle Switches Berjejer Rapi */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                  <Camera className="size-3.5 text-muted-foreground" />
                  Wajib Ambil Foto Angka Water Meter
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Petugas wajib mengunggah foto register angka meteran sebelum stand bacaan dapat disimpan dan disinkronisasi.
                </p>
              </div>
              <Switch
                checked={config.wajibFotoMeter}
                onCheckedChange={(val) => onChange('wajibFotoMeter', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  Proteksi Mock GPS & Fake Location
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Otomatis tolak dan kunci aplikasi mobile jika petugas mengaktifkan aplikasi pemalsu koordinat lokasi.
                </p>
              </div>
              <Switch
                checked={config.blokirMockGps}
                onCheckedChange={(val) => onChange('blokirMockGps', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                  <Zap className="size-3.5 text-muted-foreground" />
                  Otomatis Aktifkan Flash Kamera di Kondisi Gelap
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Membantu ketajaman foto meteran di dalam bak meter bawah tanah atau lorong minim pencahayaan.
                </p>
              </div>
              <Switch
                checked={config.autoFlashKamera}
                onCheckedChange={(val) => onChange('autoFlashKamera', val)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
