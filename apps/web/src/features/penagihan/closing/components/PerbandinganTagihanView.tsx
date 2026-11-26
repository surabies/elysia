'use client';

import { BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  ClosingSmoothPanel,
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/penagihan/closing/components/shared';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import { ClosingPerbandinganSection } from './ClosingPerbandinganSection';
import { ClosingSubNavBar } from './ClosingSubNavBar';

export function PerbandinganTagihanView() {
  const {
    periode,
    daftarPeriode,
    setPeriode,
    perbandingan,
    loading,
    refreshing,
    feedback,
    setFeedback,
    loadClosingData,
  } = useClosingWorkflow('perbandingan');

  return (
    <PageContainer className="space-y-4">
      <PageSectionHeader
        title="4. Perbandingan"
        description="Komparasi jumlah pelanggan ditagih, pemakaian air (m³), dan omzet DRD antar periode per golongan tarif."
        badge={
          <Badge variant="blue-subtle" size="md">
            <BarChart3 className="size-3" />
            <span>Komparasi Antar Periode</span>
          </Badge>
        }
        actions={
          <PeriodFilterBar
            periode={periode}
            options={daftarPeriode}
            onPeriodeChange={setPeriode}
            onRefresh={loadClosingData}
            loading={loading || refreshing}
            label="Periode"
          />
        }
      />

      <ClosingSubNavBar />

      <ClosingSmoothPanel refreshing={refreshing}>
        <StatusFeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />

        <ClosingPerbandinganSection
          perbandingan={perbandingan}
          loading={loading}
        />
      </ClosingSmoothPanel>
    </PageContainer>
  );
}
