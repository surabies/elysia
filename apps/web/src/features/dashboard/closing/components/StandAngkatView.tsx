'use client';

import Link from 'next/link';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/dashboard/shared/components';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import { ClosingStandAngkatSection } from './ClosingStandAngkatSection';
import { ClosingSubNavBar } from './ClosingSubNavBar';

export function StandAngkatView() {
  const {
    periode,
    setPeriode,
    standAngkatList,
    loading,
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
    <PageContainer className="space-y-5">
      <PageSectionHeader
        title="Data Pergantian Meter Air (Stand Angkat)"
        description="Periksa dan setujui angka meter lama yang dicabut serta angka meter baru yang dipasang agar pemakaian air pelanggan dihitung dengan benar."
        badge={
          <Badge
            variant={pendingCount === 0 ? 'green-subtle' : 'amber-subtle'}
            size="md"
          >
            <GitBranch className="size-3" />
            <span>
              {pendingCount === 0
                ? 'Semua Ganti Meter Disetujui'
                : `${pendingCount} Menunggu Persetujuan`}
            </span>
          </Badge>
        }
        actions={
          <>
            <PeriodFilterBar
              periode={periode}
              onPeriodeChange={setPeriode}
              onRefresh={loadClosingData}
              loading={loading}
              label="Periode"
            />
            <Button asChild variant="outline" size="default">
              <Link href="/tools-tutup/monitoring-tutup-bulan">
                <ArrowLeft className="size-3.5" />
                <span>Kembali ke Wizard Tutup Buku</span>
              </Link>
            </Button>
          </>
        }
      />

      <ClosingSubNavBar />

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
    </PageContainer>
  );
}
