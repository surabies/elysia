// features/dashboard/pengaturan/components/TabPengaduanGwm.tsx
// Modul Tab 5: SLA Penanganan Pengaduan & Kebijakan Ganti Water Meter (GWM)

'use client';

import * as React from 'react';
import { LifeBuoy, Wrench, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { PengaduanGwmConfig } from '../types';

interface TabPengaduanGwmProps {
  config: PengaduanGwmConfig;
  onChange: <K extends keyof PengaduanGwmConfig>(key: K, value: PengaduanGwmConfig[K]) => void;
}

export function TabPengaduanGwm({ config, onChange }: TabPengaduanGwmProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Service Level Agreement (SLA) & Kebijakan Ganti Water Meter (GWM)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Ambang batas penanganan pengaduan pelanggan, otomatisasi penerbitan SPK teknis, dan notifikasi WhatsApp.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-5">
          {/* Grid 3 Kolom Seimbang: SLA Target Penanganan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">SLA Pipa Bocor Persil</Label>
                <span className="font-mono text-xs font-semibold text-primary">{config.slaBocorPipaJam} Jam</span>
              </div>
              <Input
                type="number"
                value={config.slaBocorPipaJam}
                onChange={(e) => onChange('slaBocorPipaJam', e.target.value)}
                className="font-mono text-xs h-8.5 w-full bg-card"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Target batas waktu maksimal tim teknisi tiba dan melakukan isolasi kebocoran pipa.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">SLA Meter Macet / Rusak</Label>
                <span className="font-mono text-xs font-semibold text-primary">{config.slaMeterMacetJam} Jam</span>
              </div>
              <Input
                type="number"
                value={config.slaMeterMacetJam}
                onChange={(e) => onChange('slaMeterMacetJam', e.target.value)}
                className="font-mono text-xs h-8.5 w-full bg-card"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Target penyelesaian penggantian fisik water meter baru oleh seksi meter segel.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">SLA Sengketa Tagihan</Label>
                <span className="font-mono text-xs font-semibold text-primary">{config.slaSengketaStandJam} Jam</span>
              </div>
              <Input
                type="number"
                value={config.slaSengketaStandJam}
                onChange={(e) => onChange('slaSengketaStandJam', e.target.value)}
                className="font-mono text-xs h-8.5 w-full bg-card"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Target verifikasi ulang kubikasi dan penerbitan nota penyesuaian rekening air.
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                  <Wrench className="size-3.5 text-muted-foreground" />
                  Otomatis Terbitkan SPK GWM untuk Meter Macet Berulang
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Sistem otomatis mengarahkan ke antrean pergantian fisik jika tercatat kondisi meter macet 2 periode berturut-turut.
                </p>
              </div>
              <Switch
                checked={config.autoSpkGwmMacet}
                onCheckedChange={(val) => onChange('autoSpkGwmMacet', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5 pr-4">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                  <MessageSquare className="size-3.5 text-muted-foreground" />
                  Integrasi Notifikasi WhatsApp Gateway ke Pelanggan
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Kirim nomor tiket aduan, estimasi kedatangan teknisi lapangan, dan bukti selesai langsung ke nomor WhatsApp pelanggan.
                </p>
              </div>
              <Switch
                checked={config.waGatewayAktif}
                onCheckedChange={(val) => onChange('waGatewayAktif', val)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
