'use client';

import { PageContainer } from '@/components/layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BebanRute } from './BebanRute';
import { CaterMonitoringHeader } from './CaterMonitoringHeader';
import { PembacaanDitinjau } from './PembacaanDitinjau';
import { RingkasanCater } from './RingkasanCater';
import { RiwayatPembacaan } from './RiwayatPembacaan';
import { useCaterMonitoring, type UseCaterMonitoringOptions } from '../hooks/use-cater-monitoring';

export function MonitoringBacaMeter(props: UseCaterMonitoringOptions = {}) {
  const state = useCaterMonitoring(props);
  const periodLabel = state.month
    ? new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
        new Date(`${state.month}-01T00:00:00`),
      )
    : 'Memuat periode';

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Panel Konsisten dengan Ringkasan & Analytics (Telemetry + SSOT Period Filter) */}
      <CaterMonitoringHeader
        periodThbl={state.periodThbl}
        periodLabel={periodLabel}
        availablePeriods={state.availablePeriods}
        onPeriodChange={state.handlePeriodChange}
        onRefresh={state.refetchAll}
        loading={state.periodLoading || state.overviewLoading}
        stats={state.stats}
        routesCount={state.routes.length}
        anomaliTotal={state.anomaliKPI.totalAnomali}
      />

      {/* 2. Kartu Metrik Ringkasan (Menyesuaikan dengan Periode Terpilih) */}
      <RingkasanCater stats={state.stats} loading={state.overviewLoading || state.periodLoading} />
      {state.overviewError && (
        <Alert variant="destructive">
          <AlertDescription>Gagal memuat ringkasan: {state.overviewError}</AlertDescription>
        </Alert>
      )}

      {/* 3. Riwayat Pembacaan Petugas (Tanpa filter mandiri, terikat penuh ke Master Filter Periode) */}
      <RiwayatPembacaan
        judul="Riwayat Pembacaan Petugas"
        subjudul={`${state.riwayatSesiList.length || 9} pencatat • Periode ${periodLabel}`}
        ruteList={state.riwayatSesiList}
        month={state.month}
        loading={state.periodLoading}
        error={state.periodError}
        onRefresh={state.refetchPeriod}
      />

      {/* 4. Grid Analisis Beban Rute & Pembacaan yang Perlu Ditinjau */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BebanRute routes={state.routes} loading={state.overviewLoading} />
        <PembacaanDitinjau
          periodLabel={periodLabel}
          extremeReadings={state.extremeReadings}
          zeroReadings={state.zeroReadings}
          downReadings={state.downReadings}
          anomaliKPI={state.anomaliKPI}
          allAnomaliItems={state.allAnomaliItems}
          loading={state.periodLoading}
          error={state.periodError}
        />
      </div>
    </PageContainer>
  );
}
