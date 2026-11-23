'use client';

import * as React from 'react';
import {
  RefreshCw,
  User,
  Users,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { STANDAR_PERIODE_OPTIONS, PERIODE_BERJALAN_AKTIF } from '@/config/periode';
import { manualAddApi } from '../api';
import { ManualAddSatuanForm } from './ManualAddSatuanForm';
import { ManualAddMasalTaksasi } from './ManualAddMasalTaksasi';
import { ManualAddRiwayatTable, type RiwayatResponse } from './ManualAddRiwayatTable';

const numberFormat = new Intl.NumberFormat('id-ID');

export function ManualAddPage() {
  const [periode, setPeriode] = React.useState(PERIODE_BERJALAN_AKTIF);
  const [activeTab, setActiveTab] = React.useState('masal');
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const [kpiData, setKpiData] = React.useState<RiwayatResponse['kpi'] | null>(null);
  const [kpiLoading, setKpiLoading] = React.useState(false);

  const handleNotification = React.useCallback(
    (notif: { type: 'success' | 'error'; message: string } | null) => {
      if (!notif) return;
      if (notif.type === 'success') {
        toast.success(notif.message);
      } else {
        toast.error(notif.message);
      }
    },
    []
  );

  const fetchKpi = React.useCallback(async () => {
    setKpiLoading(true);
    try {
      const kpi = await manualAddApi.getKpi(periode);
      if (kpi) {
        setKpiData(kpi);
      }
    } catch (err) {
      console.error('Failed to fetch KPI manual add:', err);
    } finally {
      setKpiLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    void fetchKpi();
  }, [fetchKpi, refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Ringkas + Ringkasan KPI Sebaris */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3.5">
        <div>
          <h1 className="text-heading-20 font-semibold tracking-tight text-foreground">
            Manual ADD & Taksasi Pemakaian
          </h1>
          <p className="text-copy-13 text-muted-foreground mt-0.5">
            Taksasi otomatis (ST Awal = ST Akhir) untuk kondisi meter terkunci/berhalangan atau entri stand susulan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ringkasan KPI Sebaris */}
          <div className="hidden md:flex items-center gap-3 rounded-md border border-border bg-card px-3 py-1.5 text-label-12 text-muted-foreground tabular-nums">
            <span>
              Tercatat:{' '}
              <strong className="font-mono text-foreground">
                {kpiData ? numberFormat.format(kpiData.totalManual) : '—'}
              </strong>{' '}
              SL
            </span>
            <span>·</span>
            <span>
              Volume:{' '}
              <strong className="font-mono text-foreground">
                {kpiData ? numberFormat.format(kpiData.totalM3) : '—'}
              </strong>{' '}
              m³
            </span>
            <span>·</span>
            <span>
              Rata-rata:{' '}
              <strong className="font-mono text-foreground">
                {kpiData ? kpiData.rataRataM3 : '—'}
              </strong>{' '}
              m³/SL
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger
                size="sm"
                aria-label="Pilih periode kerja"
                className="w-44 font-mono text-copy-13"
              >
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent position="popper">
                {STANDAR_PERIODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.value} ({opt.label.split('(')[0].trim()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={triggerRefresh}
              disabled={kpiLoading}
              className="h-8 px-2.5 text-label-12 gap-1.5"
            >
              <RefreshCw className={cn('size-3.5', kpiLoading && 'animate-spin')} />
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Navigasi Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-border">
          <TabsList variant="line" className="h-9">
            <TabsTrigger value="masal" className="text-label-12 font-medium gap-1.5">
              <Users className="size-3.5" />
              Manual ADD Masal (Per Petugas / Rute)
            </TabsTrigger>
            <TabsTrigger value="satuan" className="text-label-12 font-medium gap-1.5">
              <User className="size-3.5" />
              Manual ADD Satuan
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="text-label-12 font-medium gap-1.5">
              <Clock className="size-3.5" />
              Riwayat ({kpiData ? numberFormat.format(kpiData.totalManual) : 0})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="masal" className="mt-3">
          <ManualAddMasalTaksasi
            periode={periode}
            onSuccess={triggerRefresh}
            setNotification={handleNotification}
          />
        </TabsContent>

        <TabsContent value="satuan" className="mt-3">
          <ManualAddSatuanForm
            periode={periode}
            onSuccess={triggerRefresh}
            setNotification={handleNotification}
          />
        </TabsContent>

        <TabsContent value="riwayat" className="mt-3">
          <ManualAddRiwayatTable
            periode={periode}
            refreshTrigger={refreshTrigger}
            onRefresh={triggerRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
