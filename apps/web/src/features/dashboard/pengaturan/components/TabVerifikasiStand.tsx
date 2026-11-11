// features/dashboard/pengaturan/components/TabVerifikasiStand.tsx
// Modul Tab 3: Konfigurasi Matriks Eskalasi Verifikasi & Kebijakan Taksasi Stand

'use client';

import * as React from 'react';
import { FileCheck2, ShieldAlert, CheckCircle2, AlertOctagon, Scale, CalendarClock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VerifikasiConfig } from '../types';

interface TabVerifikasiStandProps {
  config: VerifikasiConfig;
  onChange: <K extends keyof VerifikasiConfig>(key: K, value: VerifikasiConfig[K]) => void;
}

export function TabVerifikasiStand({ config, onChange }: TabVerifikasiStandProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Matriks Eskalasi Verifikasi & Kebijakan Taksasi Stand
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Konfigurasi tingkatan wewenang Ring 1 (Staf), Ring 2 (Supervisor), Ring 3 (Manager) serta formula taksasi stand.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-5">
          {/* Matriks 3 Ring Eskalasi (3 Kolom Seimbang) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-blue-500" />
                  Ring 1 (Staf)
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  ±{config.ambangDeviasiRing1}%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Validasi deviasi pemakaian minor, rumah kosong, atau meter terkunci dengan kelengkapan bukti foto.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="size-3.5 text-amber-500" />
                  Ring 2 (Supervisor)
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  ±{config.ambangDeviasiRing2}%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Validasi lonjakan kubikasi moderat, pembetulan salah baca angka, dan taksasi khusus wilayahan.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertOctagon className="size-3.5 text-rose-500" />
                  Ring 3 (Manager)
                </span>
                <Badge variant="destructive" className="font-mono text-[10px]">
                  &gt; {config.ambangDeviasiRing3}%
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Persetujuan mutlak lonjakan ekstrim, stand meter mundur, serta penerbitan SPK tera ulang.
              </p>
            </div>
          </div>

          {/* Grid 2 Kolom Seimbang: Metode Taksasi & Cut-Off Closing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Scale className="size-3.5 text-primary" />
                Metode Perhitungan Stand Taksasi Otomatis
              </Label>
              <Select
                value={config.metodeTaksasiDefault}
                onValueChange={(val) => onChange('metodeTaksasiDefault', val)}
              >
                <SelectTrigger className="text-xs h-9 w-full bg-card font-medium">
                  <SelectValue placeholder="Pilih metode taksasi" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectItem value="RATA_3_BULAN" className="text-xs">
                    Rata-rata 3 Bulan Terakhir (Standar SNI & Rekomendasi)
                  </SelectItem>
                  <SelectItem value="BULAN_LALU" className="text-xs">
                    Pemakaian Bulan Lalu (Flat Usage)
                  </SelectItem>
                  <SelectItem value="MIN_GOLONGAN" className="text-xs">
                    Batas Minimum Golongan (Default 10 m³)
                  </SelectItem>
                  <SelectItem value="OVERRIDE_MANUAL" className="text-xs">
                    Wajib Input Manual oleh Verifikator Ring 2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-primary" />
                Batas Waktu Cut-off Closing Verifikasi Bulanan
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Tanggal</span>
                <Input
                  type="number"
                  value={config.cutOffClosingDate}
                  onChange={(e) => onChange('cutOffClosingDate', e.target.value)}
                  className="font-mono text-xs h-9 w-20 text-center bg-card"
                />
                <span className="text-xs text-muted-foreground shrink-0">Pukul</span>
                <Input
                  type="text"
                  value={config.cutOffClosingHour}
                  onChange={(e) => onChange('cutOffClosingHour', e.target.value)}
                  className="font-mono text-xs h-9 w-24 text-center bg-card"
                />
                <span className="text-xs text-muted-foreground shrink-0">WIB</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5 pr-4">
              <Label className="text-xs font-medium text-foreground cursor-pointer">
                Wajib Catatan Alasan untuk Setiap Koreksi Stand
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Verifikator wajib mengisi justifikasi teknis sebelum perubahan stand tercatat ke tabel audit trail.
              </p>
            </div>
            <Switch
              checked={config.wajibCatatanKoreksi}
              onCheckedChange={(val) => onChange('wajibCatatanKoreksi', val)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
