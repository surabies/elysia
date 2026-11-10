'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  PageSectionHeader,
  PeriodFilterBar,
} from '@/features/dashboard/shared/components';
import { cn } from '@/lib/utils';
import { useClosingWorkflow } from '../hooks/use-closing-workflow';
import type { MonitoringTutupBulanProps } from '../types';
import { ClosingDialogs } from './ClosingDialogs';
import { ClosingSubNavBar } from './ClosingSubNavBar';
import { ClosingWizardStepper } from './ClosingWizardStepper';

export function MonitoringTutupBulan({
  initialTab,
  initialStep,
}: MonitoringTutupBulanProps = {}) {
  const {
    periode,
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
    handleOpenOnboarding,
    handlePostingDatameter,
    handleEksekusiClosing,
    handleBukaBulanBaru,
    handleVerifikasiStandAngkat,
    handleExecuteStageAction,
  } = useClosingWorkflow(initialTab, initialStep);

  return (
    <PageContainer className="space-y-5">
      <PageSectionHeader
        title="Wizard Tutup Buku & Penerbitan Tagihan"
        description="Ikuti panduan 5 langkah berurutan untuk memeriksa data, mengesahkan hasil baca meter, menerbitkan tagihan resmi, dan membuka jadwal bulan baru dengan aman."
        badge={
          <Badge variant={isTerkunci ? 'secondary' : 'green-subtle'} size="md">
            {isTerkunci ? (
              <Lock className="size-3" />
            ) : (
              <Unlock className="size-3" />
            )}
            <span>
              {isTerkunci ? 'Buku Terkunci (Selesai)' : 'Periode Berjalan'}
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
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleOpenOnboarding}
            >
              <HelpCircle className="size-3.5" />
              <span>Cara Kerja</span>
            </Button>
            <Button asChild variant="outline" size="default">
              <Link href="/tools-tutup/panduan">
                <BookOpen className="size-3.5" />
                <span>Panduan &amp; 12 Modul</span>
              </Link>
            </Button>
          </>
        }
      />

      {/* Bar Navigasi Antar Halaman Terpisah */}
      <ClosingSubNavBar />

      {/* Banner Pesan Status / Error Ramah Operator */}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-start justify-between gap-3 rounded-lg border p-4',
            feedback.type === 'error'
              ? 'border-(--ds-red-300) bg-(--ds-red-100) text-(--ds-red-900) dark:border-(--ds-red-400) dark:bg-(--ds-red-200)'
              : 'border-(--ds-green-300) bg-(--ds-green-100) text-(--ds-green-900) dark:border-(--ds-green-400) dark:bg-(--ds-green-200)',
          )}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'error' ? (
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-(--ds-red-700)" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-(--ds-green-700)" />
            )}
            <div className="space-y-1">
              {feedback.title && (
                <p className="text-label-14">{feedback.title}</p>
              )}
              <p className="text-copy-13">{feedback.message}</p>
              {feedback.dataImpact && (
                <p className="text-copy-12 opacity-90">
                  <strong>Status Keamanan Data:</strong> {feedback.dataImpact}
                </p>
              )}
              {feedback.nextAction && (
                <p className="text-copy-12">
                  <strong>Langkah yang Harus Dilakukan:</strong>{' '}
                  {feedback.nextAction}
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

      {/* Fokus Utama: Hanya 1 Kartu Wizard Aktif (Tanpa Tumpukan Puluhan Kartu di Bawah) */}
      <ClosingWizardStepper
        periode={periode}
        activeStep={activeWizardStep}
        onStepChange={setActiveWizardStep}
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
