'use client';

import * as React from 'react';
import {
  Activity,
  Calendar,
  History,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export interface CapaianHeaderProps {
  wilayah: string;
  onWilayahChange: (w: string) => void;
  tahun: number;
  onTahunChange: (t: number) => void;
  hariAcuanLps: number;
  onUpdateHariAcuanLps: (hari: number) => Promise<void>;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  onOpenRiwayat: () => void;
}

export function CapaianHeader({
  wilayah,
  onWilayahChange,
  tahun,
  onTahunChange,
  hariAcuanLps,
  onUpdateHariAcuanLps,
  onSync,
  isSyncing,
  onOpenRiwayat,
}: CapaianHeaderProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [localHari, setLocalHari] = React.useState(String(hariAcuanLps));

  React.useEffect(() => {
    setLocalHari(String(hariAcuanLps));
  }, [hariAcuanLps]);

  const handleSaveHari = async () => {
    const val = parseInt(localHari, 10);
    if (!isNaN(val) && val > 0 && val <= 365) {
      await onUpdateHariAcuanLps(val);
      setPopoverOpen(false);
    }
  };

  const todayLabel = React.useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:bg-card/40 dark:shadow-none">
      {/* 1. Ambient Lighting Highlights (Vercel Style) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/12 via-indigo-500/6 to-transparent blur-3xl dark:from-blue-500/18 dark:via-indigo-500/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-gradient-to-tr from-cyan-500/6 via-teal-500/6 to-transparent blur-3xl dark:from-cyan-500/12 dark:via-teal-500/6" />

      {/* 2. Micro-dot Grid Texture Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Row 1: Ribbon Status Telemetri */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
              PDAM Tirtawening
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-blue-500/80" />
              <span className="font-medium text-blue-700 dark:text-blue-400">
                Live Evaluasi
              </span>
              <span className="hidden sm:inline text-muted-foreground/40">/</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                Capaian Target Pembacaan Meter
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{todayLabel}</span>
            <Badge variant="blue-subtle" size="sm" className="font-mono">
              Wilayah {wilayah}
            </Badge>
          </div>
        </div>

        {/* Row 2: Title & Control Toolbar (h-8 seragam) */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Capaian Pencatatan Meter
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Evaluasi target vs realisasi sambungan langganan (SL), volume kubikasi ($M^3$), debit LPS, dan pergerakan tren tahunan.
            </p>
          </div>

          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector Wilayah */}
            <Select value={wilayah} onValueChange={onWilayahChange}>
              <SelectTrigger
                size="sm"
                className="h-8 min-w-[150px] rounded-md border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer"
              >
                <MapPin className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Wilayah" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="1">Wilayah 1 (Utara)</SelectItem>
                <SelectItem value="2">Wilayah 2 (Barat)</SelectItem>
                <SelectItem value="3">Wilayah 3 (Timur)</SelectItem>
                <SelectItem value="4">Wilayah 4 (Selatan)</SelectItem>
                <SelectItem value="5">Wilayah 5 (Pusat)</SelectItem>
              </SelectContent>
            </Select>

            {/* Selector Tahun */}
            <Select
              value={String(tahun)}
              onValueChange={(val) => onTahunChange(parseInt(val, 10))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 min-w-[105px] rounded-md border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer font-mono"
              >
                <Calendar className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>

            {/* Parameter LPS */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
                >
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span>LPS: {hariAcuanLps} Hr</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground">
                    Hari Acuan Perhitungan LPS
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Rumus: <code className="font-mono text-[10px]">M³ × 1000 ÷ (Hari × 86.400)</code>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={localHari}
                      onChange={(e) => setLocalHari(e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                    <Button size="sm" className="h-7 text-xs px-2.5" onClick={handleSaveHari}>
                      Simpan
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Tombol Sinkronisasi Transaksi */}
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
              className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
            >
              <RefreshCw className={`size-3.5 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Hitung Ulang</span>
            </Button>

            {/* Tombol Riwayat Log Audit */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRiwayat}
              className="h-8 gap-1.5 text-xs font-medium rounded-md border-border bg-background hover:bg-muted/60"
            >
              <History className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Riwayat</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
