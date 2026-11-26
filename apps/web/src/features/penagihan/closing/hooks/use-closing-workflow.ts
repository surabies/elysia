'use client';

import * as React from 'react';
import {
  executeClosingPeriode,
  executeSyncPelangganBaru,
  executeUpdateDataPelanggan,
  executeUpdateZonasi,
  executeUploadMasterPelanggan,
  fetchClosingBundle,
  initializeBulanBaru,
  postDatameterMassal,
  verifyStandAngkatMutasi,
} from '../lib/closing-api';
import {
  buildOperatorErrorFeedback,
  CLOSING_ONBOARDING_STORAGE_KEY,
  CLOSING_SESSION_STATE_KEY,
  DEFAULT_CLOSING_PERIODE,
  DEFAULT_DUE_DATE,
  DEFAULT_NEXT_PERIODE,
  evaluateClosingWizardSteps,
  formatAngkaId,
  formatRupiahId,
} from '../lib/closing-format';
import type {
  ClosingConsoleTab,
  ClosingWizardStep,
  OperatorFeedback,
  PerbandinganPeriodeData,
  PratinjauData,
  StandAngkatMutasiItem,
  StandAngkatVerificationStatus,
  WorkflowStageItem,
} from '../types';

export type ActiveClosingDialog =
  | 'posting'
  | 'closing'
  | 'bulan-baru'
  | 'mutasi'
  | 'onboarding'
  | null;

interface StoredSessionState {
  periode: string;
  activeWizardStep: ClosingWizardStep;
  reviewConfirmed: boolean;
  tanggalJatuhTempo: string;
}

function resolveInitialTab(initialTab?: string): ClosingConsoleTab {
  if (initialTab === 'stand-angkat') return 'stand-angkat';
  if (initialTab === 'perbandingan') return 'perbandingan';
  if (initialTab === 'panduan') return 'panduan';
  return 'pipeline';
}

export function useClosingWorkflow(
  initialTab?: string,
  initialStep?: ClosingWizardStep,
) {
  const [periode, setPeriode] = React.useState(DEFAULT_CLOSING_PERIODE);
  const [activeTab, setActiveTab] = React.useState<ClosingConsoleTab>(() =>
    resolveInitialTab(initialTab),
  );
  const [activeWizardStep, setActiveWizardStep] =
    React.useState<ClosingWizardStep>(initialStep ?? 1);
  const [reviewConfirmed, setReviewConfirmed] = React.useState(false);
  const [confirmPhraseInput, setConfirmPhraseInput] = React.useState('');

  const [stages, setStages] = React.useState<WorkflowStageItem[]>([]);
  const [pratinjau, setPratinjau] = React.useState<PratinjauData | null>(null);
  const [standAngkatList, setStandAngkatList] = React.useState<
    StandAngkatMutasiItem[]
  >([]);
  const [perbandingan, setPerbandingan] =
    React.useState<PerbandinganPeriodeData | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<OperatorFeedback | null>(null);

  const [activeDialog, setActiveDialog] =
    React.useState<ActiveClosingDialog>(() =>
      initialTab === 'bulan-baru' ? 'bulan-baru' : null,
    );
  const [tanggalJatuhTempo, setTanggalJatuhTempo] =
    React.useState(DEFAULT_DUE_DATE);
  const [targetBulanBaru, setTargetBulanBaru] =
    React.useState(DEFAULT_NEXT_PERIODE);

  const hasRestoredSessionRef = React.useRef(Boolean(initialStep));

  // 1. Pemulihan sesi dari sessionStorage & cek onboarding pertama kali (Client-only setelah hidrasi)
  React.useEffect(() => {
    try {
      const savedSession = window.sessionStorage.getItem(
        CLOSING_SESSION_STATE_KEY,
      );
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as Partial<StoredSessionState>;
        if (parsed.periode && /^\d{6}$/.test(parsed.periode)) {
          setPeriode(parsed.periode);
        }
        if (
          !initialStep &&
          parsed.activeWizardStep &&
          [1, 2, 3, 4, 5].includes(parsed.activeWizardStep)
        ) {
          setActiveWizardStep(parsed.activeWizardStep);
          hasRestoredSessionRef.current = true;
        }
        if (typeof parsed.reviewConfirmed === 'boolean') {
          setReviewConfirmed(parsed.reviewConfirmed);
        }
        if (parsed.tanggalJatuhTempo) {
          setTanggalJatuhTempo(parsed.tanggalJatuhTempo);
        }
      }

      const onboardingSeen = window.localStorage.getItem(
        CLOSING_ONBOARDING_STORAGE_KEY,
      );
      if (!onboardingSeen && !initialTab && !initialStep) {
        setActiveDialog('onboarding');
      }
    } catch {
      // Abaikan jika storage diblokir browser
    }
  }, [initialTab, initialStep]);

  // 2. Simpan progres wizard ke sessionStorage setiap ada perubahan
  React.useEffect(() => {
    try {
      const payload: StoredSessionState = {
        periode,
        activeWizardStep,
        reviewConfirmed,
        tanggalJatuhTempo,
      };
      window.sessionStorage.setItem(
        CLOSING_SESSION_STATE_KEY,
        JSON.stringify(payload),
      );
    } catch {
      // Abaikan jika storage penuh/diblokir
    }
  }, [periode, activeWizardStep, reviewConfirmed, tanggalJatuhTempo]);

  const loadClosingData = React.useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await fetchClosingBundle(periode);
      setStages(bundle.stages);
      setPratinjau(bundle.pratinjau);
      setStandAngkatList(bundle.standAngkatList);
      setPerbandingan(bundle.perbandingan);

      // Sinkronkan langkah wizard dengan kondisi riil database
      const evalResult = evaluateClosingWizardSteps({
        stages: bundle.stages,
        pratinjau: bundle.pratinjau,
        standAngkatList: bundle.standAngkatList,
        reviewConfirmed,
        tanggalJatuhTempo,
      });

      if (bundle.pratinjau?.status === 'TERKUNCI') {
        setActiveWizardStep(5);
      } else if (!hasRestoredSessionRef.current) {
        setActiveWizardStep(evalResult.recommendedStep);
        hasRestoredSessionRef.current = true;
      }
    } catch (err) {
      setFeedback(
        buildOperatorErrorFeedback(
          err,
          'Gagal Memuat Data Periode Penagihan',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [periode, reviewConfirmed, tanggalJatuhTempo]);

  React.useEffect(() => {
    loadClosingData();
  }, [loadClosingData]);

  const wizardEvaluation = React.useMemo(
    () =>
      evaluateClosingWizardSteps({
        stages,
        pratinjau,
        standAngkatList,
        reviewConfirmed,
        tanggalJatuhTempo,
      }),
    [stages, pratinjau, standAngkatList, reviewConfirmed, tanggalJatuhTempo],
  );

  const handleDismissOnboarding = React.useCallback(() => {
    try {
      window.localStorage.setItem(CLOSING_ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Abaikan
    }
    setActiveDialog(null);
  }, []);

  const handleOpenOnboarding = React.useCallback(() => {
    setActiveDialog('onboarding');
  }, []);

  const handlePostingDatameter = React.useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await postDatameterMassal(periode);
      setFeedback({
        type: 'success',
        title: 'Pengesahan Bacaan Meter Berhasil',
        message: res.message,
        dataImpact:
          'Seluruh angka bacaan meter kini telah disahkan dan siap ditinjau pada Langkah 3.',
      });
      setActiveDialog(null);
      await loadClosingData();
      setActiveWizardStep(3);
    } catch (err) {
      setFeedback(
        buildOperatorErrorFeedback(err, 'Gagal Mengesahkan Bacaan Meter'),
      );
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, periode, loadClosingData]);

  const handleEksekusiClosing = React.useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await executeClosingPeriode(periode, tanggalJatuhTempo);
      setFeedback({
        type: 'success',
        title: `Tutup Buku Periode ${periode} Selesai & Terkunci`,
        message: `Berhasil menerbitkan ${formatAngkaId(res.jumlahSl)} rekening tagihan air resmi dengan total nilai ${formatRupiahId(res.totalTagihan ?? pratinjau?.perkiraan.totalTagihan)}.`,
        dataImpact:
          'Buku periode ini telah dikunci secara permanen dan disimpan ke riwayat audit. Anda kini dapat menyiapkan jadwal bulan baru pada Langkah 5.',
      });
      setConfirmPhraseInput('');
      setActiveDialog(null);
      await loadClosingData();
      setActiveWizardStep(5);
    } catch (err) {
      setFeedback(
        buildOperatorErrorFeedback(err, 'Tutup Buku Tidak Dapat Diselesaikan'),
      );
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, periode, tanggalJatuhTempo, pratinjau, loadClosingData]);

  const handleBukaBulanBaru = React.useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await initializeBulanBaru(periode, targetBulanBaru);
      setFeedback({
        type: 'success',
        title: `Jadwal Bulan Baru (${targetBulanBaru}) Siap Digunakan`,
        message: res.message,
        dataImpact:
          'Daftar target pencatatan meter bulan depan telah berhasil dibuat untuk seluruh pelanggan aktif.',
      });
      setActiveDialog(null);
      await loadClosingData();
    } catch (err) {
      setFeedback(
        buildOperatorErrorFeedback(
          err,
          'Gagal Menyiapkan Jadwal Bulan Baru',
        ),
      );
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, periode, targetBulanBaru, loadClosingData]);

  const handleVerifikasiStandAngkat = React.useCallback(
    async (
      id: string,
      status: Exclude<StandAngkatVerificationStatus, 'PENDING'>,
    ) => {
      if (actionLoading) return;
      setActionLoading(true);
      try {
        const res = await verifyStandAngkatMutasi(id, status);
        setFeedback({
          type: 'success',
          title: 'Status Pergantian Meter Diperbarui',
          message: res.message,
        });
        await loadClosingData();
      } catch (err) {
        setFeedback(
          buildOperatorErrorFeedback(
            err,
            'Gagal Memperbarui Data Pergantian Meter',
          ),
        );
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, loadClosingData],
  );

  const handleExecuteStageAction = React.useCallback(
    async (stageId: string) => {
      if (stageId === 'stand-angkat') {
        setActiveTab('stand-angkat');
        return;
      }
      if (stageId === 'create-perbandingan') {
        setActiveTab('perbandingan');
        return;
      }
      if (stageId === 'posting-datameter') {
        setActiveDialog('posting');
        return;
      }
      if (stageId === 'create-closed-drd') {
        setActiveDialog('closing');
        return;
      }
      if (stageId === 'create-bulan-baru') {
        setActiveDialog('bulan-baru');
        return;
      }

      if (actionLoading) return;
      setActionLoading(true);
      try {
        let res: { message: string } | null = null;
        if (stageId === 'update-zonasi') {
          res = await executeUpdateZonasi(periode);
        } else if (stageId === 'upload-master-pelanggan') {
          res = await executeUploadMasterPelanggan(periode);
        } else if (stageId === 'sync-pelanggan-baru') {
          res = await executeSyncPelangganBaru(periode);
        } else if (stageId === 'update-data-pelanggan') {
          res = await executeUpdateDataPelanggan(periode);
        }

        if (res) {
          setFeedback({
            type: 'success',
            title: 'Penyelarasan Data Berhasil',
            message: res.message,
          });
          await loadClosingData();
        }
      } catch (err) {
        setFeedback(
          buildOperatorErrorFeedback(err, 'Gagal Menjalankan Penyelarasan Data'),
        );
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, periode, loadClosingData],
  );

  const handlePeriodeChange = React.useCallback((newPeriode: string) => {
    setPeriode(newPeriode);
    setReviewConfirmed(false);
    setConfirmPhraseInput('');
    hasRestoredSessionRef.current = false;
  }, []);

  return {
    periode,
    setPeriode: handlePeriodeChange,
    activeTab,
    setActiveTab,
    activeWizardStep,
    setActiveWizardStep,
    wizardSteps: wizardEvaluation.steps,
    recommendedStep: wizardEvaluation.recommendedStep,
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
    isTerkunci: pratinjau?.status === 'TERKUNCI',
    loadClosingData,
    handleDismissOnboarding,
    handleOpenOnboarding,
    handlePostingDatameter,
    handleEksekusiClosing,
    handleBukaBulanBaru,
    handleVerifikasiStandAngkat,
    handleExecuteStageAction,
  };
}
