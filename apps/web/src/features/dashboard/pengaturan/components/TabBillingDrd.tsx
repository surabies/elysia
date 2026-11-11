// features/dashboard/pengaturan/components/TabBillingDrd.tsx
// Modul Tab 4: Parameter Biaya Beban Tetap, Administrasi & Denda Rekening DRD

'use client';

import * as React from 'react';
import { Receipt, Calendar, Percent, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BillingDrdConfig } from '../types';

interface TabBillingDrdProps {
  config: BillingDrdConfig;
  onChange: <K extends keyof BillingDrdConfig>(key: K, value: BillingDrdConfig[K]) => void;
}

export function TabBillingDrd({ config, onChange }: TabBillingDrdProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Biaya Beban Tetap, Administrasi, & Skema Denda Keterlambatan
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Komponen tarif penyusunan Daftar Rekening Ditagihkan (DRD) dan aturan penagihan piutang rekening air.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-5">
          {/* Grid 4 Kolom Seimbang: Beban Pemeliharaan & Administrasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground block">
                Bea Administrasi:
              </Label>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-muted-foreground">Rp</span>
                <Input
                  type="number"
                  value={config.beaAdminDefault}
                  onChange={(e) => onChange('beaAdminDefault', e.target.value)}
                  className="h-8.5 font-mono text-xs w-full bg-card"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground block">
                Pemeliharaan RT:
              </Label>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-muted-foreground">Rp</span>
                <Input
                  type="number"
                  value={config.beaPemeliharaanRT}
                  onChange={(e) => onChange('beaPemeliharaanRT', e.target.value)}
                  className="h-8.5 font-mono text-xs w-full bg-card"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground block">
                Pemeliharaan Niaga:
              </Label>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-muted-foreground">Rp</span>
                <Input
                  type="number"
                  value={config.beaPemeliharaanNiaga}
                  onChange={(e) => onChange('beaPemeliharaanNiaga', e.target.value)}
                  className="h-8.5 font-mono text-xs w-full bg-card"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground block">
                Pemeliharaan Industri:
              </Label>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-muted-foreground">Rp</span>
                <Input
                  type="number"
                  value={config.beaPemeliharaanIndustri}
                  onChange={(e) => onChange('beaPemeliharaanIndustri', e.target.value)}
                  className="h-8.5 font-mono text-xs w-full bg-card"
                />
              </div>
            </div>
          </div>

          {/* Grid 3 Kolom Seimbang: Jatuh Tempo & Skema Denda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                Tanggal Jatuh Tempo Pembayaran
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Setiap tanggal</span>
                <Input
                  type="number"
                  value={config.tanggalJatuhTempo}
                  onChange={(e) => onChange('tanggalJatuhTempo', e.target.value)}
                  className="font-mono text-xs h-9 w-20 text-center bg-card"
                />
                <span className="text-xs text-muted-foreground shrink-0">bulan berjalan</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Percent className="size-3.5 text-primary" />
                Skema Denda Keterlambatan
              </Label>
              <Select
                value={config.skemaDenda}
                onValueChange={(val) => onChange('skemaDenda', val)}
              >
                <SelectTrigger className="text-xs h-9 w-full bg-card font-medium">
                  <SelectValue placeholder="Pilih skema denda" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectItem value="FLAT" className="text-xs">
                    Nominal Tetap (Flat per Bulan)
                  </SelectItem>
                  <SelectItem value="PERCENTAGE" className="text-xs">
                    Persentase dari Nilai Rekening (5%)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Denda Keterlambatan
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground shrink-0">Rp</span>
                <Input
                  type="number"
                  value={config.nominalDendaFlat}
                  onChange={(e) => onChange('nominalDendaFlat', e.target.value)}
                  className="font-mono text-xs h-9 w-full bg-card"
                />
                <span className="text-xs text-muted-foreground shrink-0">/rek</span>
              </div>
            </div>
          </div>

          {/* Ambang Surat Peringatan & Segel Meter */}
          <div className="p-4 rounded-lg border border-border/80 bg-muted/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ambang Surat Peringatan 1 (SP1):</span>
              <span className="font-mono font-semibold text-foreground">Tunggakan &gt; 2 Bulan</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="size-3.5 text-rose-500" />
                Ambang Tindakan Segel / Cabut Meter:
              </span>
              <span className="font-mono font-semibold text-destructive">Tunggakan &gt; 3 Bulan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
