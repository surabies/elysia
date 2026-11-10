'use client';

import { PageContainer } from '@/components/layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BebanRute } from './BebanRute';
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
      <header className="space-y-1 border-b pb-5">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Operasional</Badge>
          <span className="text-label-12 text-muted-foreground">Baca meter CHN</span>
        </div>
        <h1 className="text-heading-32 tracking-tight">Monitoring Baca Meter</h1>
        <p className="text-copy-14 text-muted-foreground">
          Ringkasan pelanggan, produktivitas petugas, dan pembacaan yang perlu ditinjau.
        </p>
      </header>

      <RingkasanCater stats={state.stats} loading={state.overviewLoading} />
      {state.overviewError && (
        <Alert variant="destructive">
          <AlertDescription>Gagal memuat ringkasan: {state.overviewError}</AlertDescription>
        </Alert>
      )}
      <RiwayatPembacaan
        judul="Riwayat Pembacaan Petugas"
        subjudul={`${state.riwayatSesiList.length || 9} pencatat • Periode ${periodLabel}`}
        ruteList={state.riwayatSesiList}
        month={state.month}
        onMonthChange={state.setMonth}
        loading={state.periodLoading}
        error={state.periodError}
        onRefresh={state.refetchPeriod}
      />
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
