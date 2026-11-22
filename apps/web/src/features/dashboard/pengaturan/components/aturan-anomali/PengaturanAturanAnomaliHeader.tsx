// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/PengaturanAturanAnomaliHeader.tsx
// Header Modul Pengaturan SSOT dengan Geist Tokens (Compact & Shrink-0)

'use client';

import * as React from 'react';
import { SlidersHorizontal, Info, RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface HeaderProps {
  versiAktif: number;
  canEdit: boolean;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
}

export function PengaturanAturanAnomaliHeader({
  versiAktif,
  canEdit,
  isLoading,
  searchQuery,
  onSearchChange,
  onRefresh,
}: HeaderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="size-4.5 text-primary" />
          <h1 className="text-heading-20 font-semibold tracking-tight text-foreground">
            Manajemen Aturan Anomali & Deviasi
          </h1>
          <Badge variant="teal-subtle" className="font-mono text-label-11">
            Versi Aktif: v{versiAktif}
          </Badge>
        </div>
        <p className="text-copy-13 text-muted-foreground">
          Pusat SSOT konfigurasi aturan anomali meter air, ambang batas kubikasi, pemetaan kondisi TMSS, dan audit trail per versi.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {mounted && !canEdit && (
          <Badge variant="amber-subtle" className="text-label-11 gap-1">
            <Info className="size-3" />
            Mode Baca (Staf)
          </Badge>
        )}

        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari kode / aturan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-label-12 bg-card"
          />
        </div>

        <Button
          variant="outline"
          size="default"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 px-2.5 text-label-12 gap-1.5 cursor-pointer"
          title="Segarkan data aturan"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Segarkan</span>
        </Button>
      </div>
    </div>
  );
}
