// features/dashboard/pengaturan/components/TabSistemAudit.tsx
// Modul Tab 6: Preferensi Tampilan Antarmuka & Integritas Audit Trail

'use client';

import * as React from 'react';
import { Sliders, Volume2, Database, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SistemAuditConfig } from '../types';

interface TabSistemAuditProps {
  config: SistemAuditConfig;
  onChange: <K extends keyof SistemAuditConfig>(key: K, value: SistemAuditConfig[K]) => void;
}

export function TabSistemAudit({ config, onChange }: TabSistemAuditProps) {
  return (
    <div className="space-y-5">
      <Card className="border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground tracking-tight">
              Preferensi Tampilan & Integritas Audit Trail
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Kerapatan visual antarmuka Vercel, tingkat pencatatan mutasi transaksi, dan telemetri lapisan arsitektur.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 pt-4 space-y-5">
          {/* Grid 2 Kolom Seimbang: Kepadatan & Audit Logging */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
            <div className="space-y-2.5 p-4 rounded-lg border border-border/80 bg-muted/20">
              <Label className="text-xs font-medium text-foreground block">
                Kepadatan Tata Letak Data Grid
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={config.kepadatanTabel === 'compact' ? 'default' : 'outline'}
                  onClick={() => onChange('kepadatanTabel', 'compact')}
                  className="text-xs h-8.5 cursor-pointer flex-1"
                >
                  Kompak (High-Density)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={config.kepadatanTabel === 'comfortable' ? 'default' : 'outline'}
                  onClick={() => onChange('kepadatanTabel', 'comfortable')}
                  className="text-xs h-8.5 cursor-pointer flex-1"
                >
                  Nyaman (Comfortable)
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Gaya Kompak memaksimalkan jumlah baris bacaan per layar tanpa perlu scroll berlebih.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-lg border border-border/80 bg-muted/20">
              <Label className="text-xs font-medium text-foreground block">
                Tingkat Detail Audit Trail Logging
              </Label>
              <Select
                value={config.levelAuditTrail}
                onValueChange={(val) => onChange('levelAuditTrail', val)}
              >
                <SelectTrigger className="text-xs h-8.5 w-full bg-card font-medium">
                  <SelectValue placeholder="Pilih tingkat audit" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectItem value="VERBOSE" className="text-xs">
                    Maksimal (Catat Setiap SQL Mutasi & Nilai Lama-Baru)
                  </SelectItem>
                  <SelectItem value="STANDARD" className="text-xs">
                    Standar (Hanya Event Approval & Closing)
                  </SelectItem>
                  <SelectItem value="CRITICAL_ONLY" className="text-xs">
                    Kritis Saja (Hanya Anomali Ekstrim)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Seluruh mutasi nilai stand meter tersimpan permanen demi akuntabilitas audit BPKP.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-card hover:bg-muted/30 transition-colors">
            <div className="space-y-0.5 pr-4">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
                <Volume2 className="size-3.5 text-muted-foreground" />
                Peringatan Audio untuk Stand Anomali Ekstrem
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Mainkan nada indikator singkat saat sinkronisasi mendeteksi stand bernilai anomali kritis.
              </p>
            </div>
            <Switch
              checked={config.suaraAlertAnomali}
              onCheckedChange={(val) => onChange('suaraAlertAnomali', val)}
            />
          </div>

          {/* Arsitektur Stack Status Telemetry */}
          <div className="pt-2 border-t border-border/80">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2.5">
              <Database className="size-3.5 text-primary" />
              Telemetri Status Stack Produksi
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-md border border-border/80 bg-muted/40">
                <span className="text-[10px] text-muted-foreground block">Basis Data</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="size-3" /> PostgreSQL Neon
                </span>
              </div>
              <div className="p-3 rounded-md border border-border/80 bg-muted/40">
                <span className="text-[10px] text-muted-foreground block">Spasial GIS</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="size-3" /> PostGIS Active
                </span>
              </div>
              <div className="p-3 rounded-md border border-border/80 bg-muted/40">
                <span className="text-[10px] text-muted-foreground block">Mesin Tarif</span>
                <span className="text-foreground font-semibold block mt-0.5">
                  TagihanEngine 4-Tier
                </span>
              </div>
              <div className="p-3 rounded-md border border-border/80 bg-muted/40">
                <span className="text-[10px] text-muted-foreground block">Keamanan</span>
                <span className="text-foreground font-semibold block mt-0.5">
                  Better-Auth RBAC
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
