'use client';

import { PageContainer } from '@/components/layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BebanRute } from './BebanRute';
import { PembacaanDitinjau } from './PembacaanDitinjau';
import { ProduktivitasPetugas } from './ProduktivitasPetugas';
import { RingkasanCater } from './RingkasanCater';
import { useCaterMonitoring } from '../hooks/useCaterMonitoring';

export function MonitoringBacaMeter() {
  const state = useCaterMonitoring();
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
      <ProduktivitasPetugas
        month={state.month}
        onMonthChange={state.setMonth}
        periodLabel={periodLabel}
        items={state.petugasProgress}
        loading={state.periodLoading}
        error={state.periodError}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <BebanRute routes={state.routes} loading={state.overviewLoading} />
        <PembacaanDitinjau
          periodLabel={periodLabel}
          extremeReadings={state.extremeReadings}
          zeroReadings={state.zeroReadings}
          loading={state.periodLoading}
          error={state.periodError}
        />
      </div>
    </PageContainer>
  );
}
