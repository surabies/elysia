'use client';

import { GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  ClosingSmoothPanel,
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/penagihan/closing/components/shared';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import { ClosingStandAngkatSection } from './ClosingStandAngkatSection';
import { ClosingSubNavBar } from './ClosingSubNavBar';

export function StandAngkatView() {
  const {
    periode,
    daftarPeriode,
    setPeriode,
    standAngkatList,
    loading,
    refreshing,
    actionLoading,
    feedback,
    setFeedback,
    loadClosingData,
    handleVerifikasiStandAngkat,
  } = useClosingWorkflow('stand-angkat');

  const pendingCount = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'PENDING',
  ).length;

  return (
    <PageContainer className="space-y-4">
      <PageSectionHeader
        title="1. Ganti Meter"
        description="Periksa dan setujui angka stand angkat meter lama serta stand pasang meter baru sebelum tutup buku."
        badge={
          <Badge
            variant={pendingCount === 0 ? 'green-subtle' : 'amber-subtle'}
            size="md"
          >
            <GitBranch className="size-3" />
            <span>
              {pendingCount === 0
                ? 'Semua Disetujui'
                : `${pendingCount} Menunggu`}
            </span>
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

        <ClosingStandAngkatSection
          periode={periode}
          standAngkatList={standAngkatList}
          loading={loading}
          actionLoading={actionLoading}
          onVerifyStandAngkat={handleVerifikasiStandAngkat}
        />
      </ClosingSmoothPanel>
    </PageContainer>
  );
}
