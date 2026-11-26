'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  ClosingSmoothPanel,
  PageSectionHeader,
  PeriodFilterBar,
} from '@/features/penagihan/closing/components/shared';
import { cn } from '@/lib/utils';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import { formatPeriodeLabelId } from '../lib/closing-format';
import type { MonitoringTutupBulanProps } from '../types';
import { ClosingDialogs } from './ClosingDialogs';
import { ClosingSubNavBar } from './ClosingSubNavBar';
import { ClosingWizardStepper } from './ClosingWizardStepper';

export function MonitoringTutupBulan({
  highlightStage,
  initialTab,
  initialStep,
}: MonitoringTutupBulanProps = {}) {
  const {
    periode,
    daftarPeriode,
    setPeriode,
    setActiveTab,
    activeWizardStep,
    setActiveWizardStep,
    wizardSteps,
    reviewConfirmed,
    setReviewConfirmed,
    confirmPhraseInput,
    setConfirmPhraseInput,
    stages,
    pratinjau,
    standAngkatList,
    perbandingan,
    loading,
    refreshing,
    actionLoading,
    feedback,
    setFeedback,
    activeDialog,
    setActiveDialog,
    tanggalJatuhTempo,
    setTanggalJatuhTempo,
    targetBulanBaru,
    setTargetBulanBaru,
    isTerkunci,
    loadClosingData,
    handleDismissOnboarding,
    handlePostingDatameter,
    handleEksekusiClosing,
    handleBukaBulanBaru,
    handleVerifikasiStandAngkat,
    handleExecuteStageAction,
  } = useClosingWorkflow(initialTab, initialStep);

  return (
    <PageContainer className="space-y-4">
      <PageSectionHeader
        title="5. Tutup Bulan"
        description="Konsol kendali akhir: verifikasi 5 syarat kesiapan, sahkan bacaan meter (V3), kunci buku DRD resmi, dan inisialisasi siklus baru."
        badge={
          <Badge variant={isTerkunci ? 'secondary' : 'green-subtle'} size="md">
            {isTerkunci ? (
              <Lock className="size-3" />
            ) : (
              <Unlock className="size-3" />
            )}
            <span>
              {formatPeriodeLabelId(periode)} ·{' '}
              {isTerkunci ? 'Terkunci' : 'Berjalan'}
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
            label="Periode Kerja"
          />
        }
      />

      <ClosingSubNavBar />

      <ClosingSmoothPanel refreshing={refreshing}>
        {/* Banner Umpan Balik Ringkas */}
        {feedback && (
          <div
            role={feedback.type === 'error' ? 'alert' : 'status'}
            className={cn(
              'flex items-start justify-between gap-3 rounded-lg border px-4 py-3',
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50/40 text-red-900 dark:border-red-950/60 dark:bg-red-950/20 dark:text-red-300'
                : 'border-emerald-200 bg-emerald-50/40 text-emerald-900 dark:border-emerald-950/60 dark:bg-emerald-950/20 dark:text-emerald-300',
            )}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === 'error' ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <div className="space-y-0.5 text-xs">
                {feedback.title && (
                  <p className="font-semibold">{feedback.title}</p>
                )}
                <p className="leading-relaxed opacity-95">{feedback.message}</p>
                {feedback.nextAction && (
                  <p className="text-[11px] opacity-85">
                    <strong>Langkah:</strong> {feedback.nextAction}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setFeedback(null)}
              aria-label="Tutup pesan"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        <ClosingWizardStepper
          periode={periode}
          targetBulanBaru={targetBulanBaru}
          activeStep={activeWizardStep}
          onStepChange={setActiveWizardStep}
          onSwitchPeriode={setPeriode}
          highlightStage={highlightStage}
          steps={wizardSteps}
          pratinjau={pratinjau}
          stages={stages}
          standAngkatList={standAngkatList}
          perbandingan={perbandingan}
          loading={loading}
          actionLoading={actionLoading}
          reviewConfirmed={reviewConfirmed}
          onReviewConfirmedChange={setReviewConfirmed}
          tanggalJatuhTempo={tanggalJatuhTempo}
          onTanggalJatuhTempoChange={setTanggalJatuhTempo}
          onOpenDialog={setActiveDialog}
          onSelectTab={setActiveTab}
          onExecuteStageAction={handleExecuteStageAction}
        />
      </ClosingSmoothPanel>

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
        onOpenFullGuide={setActiveTab}
      />
    </PageContainer>
  );
}
