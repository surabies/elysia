'use client';

import * as React from 'react';
import {
  FilePlus,
  RefreshCw,
  User,
  Users,
  ClipboardList,
  Droplets,
  Gauge,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { ManualAddSatuanForm } from './ManualAddSatuanForm';
import { ManualAddMasalTaksasi } from './ManualAddMasalTaksasi';
import { ManualAddRiwayatTable, type RiwayatResponse } from './ManualAddRiwayatTable';

const numberFormat = new Intl.NumberFormat('id-ID');

export function ManualAddPage() {
  const [periode, setPeriode] = React.useState('202601');
  const [activeTab, setActiveTab] = React.useState('satuan');
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Shared notification state
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Riwayat KPI State
  const [kpiData, setKpiData] = React.useState<RiwayatResponse['kpi'] | null>(null);
  const [kpiLoading, setKpiLoading] = React.useState(false);

  // Fetch KPI data whenever periode or refreshTrigger changes
  const fetchKpi = React.useCallback(async () => {
    setKpiLoading(true);
    try {
      const res = await fetch(`/api/v1/manual-add/riwayat?periode=${periode}&limit=1`);
      const json = await res.json();
      if (json.success && json.data) {
        setKpiData(json.data.kpi);
      }
    } catch (err) {
      console.error('Failed to fetch KPI manual add:', err);
    } finally {
      setKpiLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    fetchKpi();
  }, [fetchKpi, refreshTrigger]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FilePlus className="size-6 text-primary" />
            Manual ADD & Taksasi Stand Meter
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Input stand darurat satuan per pelanggan atau taksasi masal per petugas / rute ketika petugas berhalangan hadir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs">
            <span className="text-muted-foreground font-medium">Periode Kerja:</span>
            <NativeSelect
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              size="xs"
              className="border-none shadow-none font-semibold text-foreground focus-visible:ring-0 p-0 pr-6"
            >
              <NativeSelectOption value="202601">Januari 2026 (202601)</NativeSelectOption>
              <NativeSelectOption value="202512">Desember 2025 (202512)</NativeSelectOption>
              <NativeSelectOption value="202511">November 2025 (202511)</NativeSelectOption>
              <NativeSelectOption value="202602">Februari 2026 (202602)</NativeSelectOption>
            </NativeSelect>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerRefresh}
            disabled={kpiLoading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn('size-3.5', kpiLoading && 'animate-spin')} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* 2. Notification Toast / Alert */}
      {notification && (
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-lg border text-copy-13 transition-all',
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          )}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. KPI Cards Rekapitulasi Manual ADD */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Catatan Manual</span>
            <ClipboardList className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {kpiData ? numberFormat.format(kpiData.totalManual) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">pelanggan</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Terekam di periode {periode}</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Kubikasi Ditagihkan</span>
            <Droplets className="size-4 text-teal-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {kpiData ? numberFormat.format(kpiData.totalM3) : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">m³</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Volume manual resmi</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Rata-rata Taksasi</span>
            <Gauge className="size-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {kpiData ? `${kpiData.rataRataM3}` : '...'}
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">m³ / SL</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Historis rata-rata konsumsi</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Integritas Stand</span>
            <Clock className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            100%
            <span className="text-xs font-normal text-muted-foreground ml-1.5 font-sans">valid</span>
          </div>
          <p className="mt-1 text-label-11 text-muted-foreground">Audit trail & offsite log</p>
        </Card>
      </div>

      {/* 4. Tabs Modular Workspace: Satuan vs Masal vs Riwayat */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <TabsList variant="line" className="h-9">
            <TabsTrigger value="satuan" className="text-xs font-semibold gap-2">
              <User className="size-3.5 text-primary" />
              Manual ADD Satuan
            </TabsTrigger>
            <TabsTrigger value="masal" className="text-xs font-semibold gap-2">
              <Users className="size-3.5 text-amber-500" />
              Manual ADD Masal (Per Petugas / Rute)
              <Badge variant="outline" className="text-[9px] px-1 py-0 font-bold bg-amber-500/10 text-amber-600 border-amber-500/30">
                Taksasi Dinamis
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="text-xs font-semibold gap-2">
              <Clock className="size-3.5 text-teal-500" />
              Daftar Riwayat Rekaman
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
            {activeTab === 'satuan'
              ? 'Mode Entri Individu Berita Acara'
              : activeTab === 'masal'
              ? 'Mode Otomasi Petugas Berhalangan'
              : 'Audit Log & Rekapitulasi Pembacaan'}
          </span>
        </div>

        {/* Tab 1: Manual ADD Satuan */}
        <TabsContent value="satuan" className="mt-4">
          <ManualAddSatuanForm
            periode={periode}
            onSuccess={triggerRefresh}
            setNotification={setNotification}
          />
        </TabsContent>

        {/* Tab 2: Manual ADD Masal (Taksasi Dinamis) */}
        <TabsContent value="masal" className="mt-4">
          <ManualAddMasalTaksasi
            periode={periode}
            onSuccess={triggerRefresh}
            setNotification={setNotification}
          />
        </TabsContent>

        {/* Tab 3: Riwayat Lengkap */}
        <TabsContent value="riwayat" className="mt-4">
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
