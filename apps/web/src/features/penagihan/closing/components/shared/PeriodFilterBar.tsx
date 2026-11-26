'use client';

import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface PeriodFilterBarProps {
  periode: string;
  onPeriodeChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  label?: string;
}

export function PeriodFilterBar({
  periode,
  onPeriodeChange,
  onRefresh,
  loading = false,
  label = 'Periode',
}: PeriodFilterBarProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-(--ds-gray-100) p-1">
      <span className="px-2 text-label-12 text-muted-foreground">{label}</span>
      <Input
        size="sm"
        value={periode}
        onChange={(e) => onPeriodeChange(e.target.value)}
        className="h-7 w-22 bg-card px-2 text-center font-mono text-label-12 text-foreground tabular-nums"
        placeholder="YYYYMM"
        aria-label={label}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
        className="h-7 px-2.5 text-button-12"
      >
        <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
        <span>Muat Ulang</span>
      </Button>
    </div>
  );
}
