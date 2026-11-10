'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/dashboard/shared/components';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import { ClosingDialogs } from './ClosingDialogs';
import { ClosingHelpGuide } from './ClosingHelpGuide';
import { ClosingSubNavBar } from './ClosingSubNavBar';
import { ClosingWorkflowMatrix } from './ClosingWorkflowMatrix';

interface PanduanClosingViewProps {
  defaultSection?: 'panduan' | 'matrix';
  highlightStage?: string;
}

export function PanduanClosingView({
  defaultSection = 'panduan',
  highlightStage,
}: PanduanClosingViewProps = {}) {
  const [section, setSection] = React.useState<'panduan' | 'matrix'>(
    highlightStage ? 'matrix' : defaultSection,
  );

  const {
    periode,
    setPeriode,
    stages,
    pratinjau,
    standAngkatList,
    loading,
    actionLoading,
    feedback,
    setFeedback,
    activeDialog,
    setActiveDialog,
    tanggalJatuhTempo,
    setTanggalJatuhTempo,
    targetBulanBaru,
    setTargetBulanBaru,
    confirmPhraseInput,
    setConfirmPhraseInput,
    loadClosingData,
    handleDismissOnboarding,
    handlePostingDatameter,
    handleEksekusiClosing,
    handleBukaBulanBaru,
    handleVerifikasiStandAngkat,
    handleExecuteStageAction,
  } = useClosingWorkflow('panduan');

  return (
    <PageContainer className="space-y-5">
      <PageSectionHeader
        title="Peta 12 Modul & Panduan Lengkap Tutup Buku"
        description="Penjelasan alur kerja, rumus perhitungan tarif air 4 blok, cara mengatasi kendala, serta status teknis 12 modul tutup buku."
        badge={
          <Badge variant="blue-subtle" size="md">
            <BookOpen className="size-3" />
            <span>Dokumentasi &amp; Peta Sistem</span>
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

      <Tabs
        value={section}
        onValueChange={(v) => setSection(v as 'panduan' | 'matrix')}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="panduan">
            <BookOpen className="size-3.5" />
            <span>1. Panduan Kerja &amp; Rumus Tagihan</span>
          </TabsTrigger>
          <TabsTrigger value="matrix">
            <Workflow className="size-3.5" />
            <span>2. Peta Status 12 Modul Teknis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panduan" className="space-y-4">
          <ClosingHelpGuide onSelectTab={() => setSection('matrix')} />
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <ClosingWorkflowMatrix
            stages={stages}
            highlightStage={highlightStage}
            standAngkatCount={standAngkatList.length}
            actionLoading={actionLoading}
            onOpenMutasiDialog={() => setActiveDialog('mutasi')}
            onExecuteStageAction={handleExecuteStageAction}
          />
        </TabsContent>
      </Tabs>

      <ClosingDialogs
        periode={periode}
        pratinjau={pratinjau}
        standAngkatList={standAngkatList}
        activeDialog={activeDialog}
        onDialogChange={setActiveDialog}
        actionLoading={actionLoading}
        tanggalJatuhTempo={tanggalJatuhTempo}
        onTanggalJatuhTempoChange={setTanggalJatuhTempo}
        targetBulanBaru={targetBulanBaru}
        onTargetBulanBaruChange={setTargetBulanBaru}
        confirmPhraseInput={confirmPhraseInput}
        onConfirmPhraseInputChange={setConfirmPhraseInput}
        onConfirmPosting={handlePostingDatameter}
        onConfirmClosing={handleEksekusiClosing}
        onConfirmBulanBaru={handleBukaBulanBaru}
        onVerifyStandAngkat={handleVerifikasiStandAngkat}
        onDismissOnboarding={handleDismissOnboarding}
      />
    </PageContainer>
  );
}
