'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/dashboard/shared/components';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import { ClosingPerbandinganSection } from './ClosingPerbandinganSection';
import { ClosingSubNavBar } from './ClosingSubNavBar';

export function PerbandinganTagihanView() {
  const {
    periode,
    setPeriode,
    perbandingan,
    loading,
    feedback,
    setFeedback,
    loadClosingData,
  } = useClosingWorkflow('perbandingan');

  return (
    <PageContainer className="space-y-5">
      <PageSectionHeader
        title="Perbandingan Tagihan Bulan Lalu vs Bulan Ini"
        description="Bandingkan jumlah pelanggan ditagih, pemakaian air (m³), dan nilai rupiah tagihan antar periode per golongan tarif sebelum mengunci buku."
        badge={
          <Badge variant="blue-subtle" size="md">
            <BarChart3 className="size-3" />
            <span>Komparasi Antar Periode</span>
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

      <ClosingPerbandinganSection
        perbandingan={perbandingan}
        loading={loading}
      />
    </PageContainer>
  );
}
