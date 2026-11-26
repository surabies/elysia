'use client';

import * as React from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STANDAR_PERIODE_OPTIONS } from '@/config/periode';
import { cn } from '@/lib/utils';
import { fetchPeriodeKerjaInfo } from '../../lib/closing-api';
import { formatPeriodeLabelId } from '../../lib/closing-format';
import type { PeriodeDaftarItem } from '../../types';

export interface PeriodFilterBarProps {
  periode: string;
  onPeriodeChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  label?: string;
  options?: PeriodeDaftarItem[];
}

export function PeriodFilterBar({
  periode,
  onPeriodeChange,
  onRefresh,
  loading = false,
  label = 'Periode',
  options,
}: PeriodFilterBarProps) {
  const [fetchedOptions, setFetchedOptions] = React.useState<PeriodeDaftarItem[]>(
    [],
  );

  React.useEffect(() => {
    if (options && options.length > 0) return;
    let cancelled = false;
    fetchPeriodeKerjaInfo().then((info) => {
      if (!cancelled && info?.daftarPeriode?.length) {
        setFetchedOptions(info.daftarPeriode);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [options]);

  const mergedOptions = React.useMemo(() => {
    const source: PeriodeDaftarItem[] =
      options && options.length > 0
        ? options
        : fetchedOptions.length > 0
          ? fetchedOptions
          : STANDAR_PERIODE_OPTIONS.map((item) => ({
              periode: item.value,
              status: item.status,
            }));

    const map = new Map<string, PeriodeDaftarItem>();
    for (const item of source) {
      map.set(item.periode, item);
    }
    if (periode && /^\d{6}$/.test(periode) && !map.has(periode)) {
      map.set(periode, { periode, status: 'BERJALAN' });
    }
    return Array.from(map.values()).sort((a, b) =>
      b.periode.localeCompare(a.periode),
    );
  }, [options, fetchedOptions, periode]);

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <Select value={periode} onValueChange={onPeriodeChange}>
        <SelectTrigger
          size="sm"
          aria-label={label}
          className="min-w-56 font-sans"
        >
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Pilih Periode" />
          </div>
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {mergedOptions.map((item) => (
            <SelectItem key={item.periode} value={item.periode}>
              <span className="font-medium text-foreground">
                {formatPeriodeLabelId(item.periode)}
              </span>{' '}
              <span className="font-mono text-muted-foreground">
                ({item.periode})
              </span>{' '}
              <span className="text-muted-foreground">
                · {item.status === 'TERKUNCI' ? 'Terkunci' : 'Berjalan'}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
        <span>Muat Ulang</span>
      </Button>
    </div>
  );
}
