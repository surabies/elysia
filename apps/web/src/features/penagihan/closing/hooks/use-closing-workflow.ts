'use client';

import * as React from 'react';
import {
  executeClosingPeriode,
  executeSyncPelangganBaru,
  executeUpdateDataPelanggan,
  executeUpdateZonasi,
  executeUploadMasterPelanggan,
  fetchClosingBundle,
  fetchPeriodeKerjaInfo,
  initializeBulanBaru,
  postDatameterMassal,
  verifyStandAngkatMutasi,
} from '../lib/closing-api';
import {
  getCachedClosingBundle,
  getCachedPeriodeInfo,
  getSharedClosingPeriode,
  isClosingBundleFresh,
  setSharedClosingPeriode,
  subscribeSharedClosingPeriode,
} from '../lib/closing-cache';
import {
  buildOperatorErrorFeedback,
  CLOSING_ONBOARDING_STORAGE_KEY,
  CLOSING_SESSION_STATE_KEY,
  computeDefaultDueDate,
  computeNextPeriode,
  evaluateClosingWizardSteps,
  formatAngkaId,
  formatPeriodeLabelId,
  formatRupiahId,
} from '../lib/closing-format';
import type {
  ClosingConsoleTab,
  ClosingWizardStep,
  OperatorFeedback,
  PerbandinganPeriodeData,
  PeriodeDaftarItem,
  PratinjauData,
  StandAngkatDecisionStatus,
  StandAngkatMutasiItem,
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
  const initialPeriode = getSharedClosingPeriode({ ssrSafe: true });
  const initialCachedBundle = getCachedClosingBundle(initialPeriode);
  const initialCachedPeriodeInfo = getCachedPeriodeInfo();

  const [periode, setPeriodeState] = React.useState(initialPeriode);
  const [activeTab, setActiveTab] = React.useState<ClosingConsoleTab>(() =>
    resolveInitialTab(initialTab),
  );
  const [activeWizardStep, setActiveWizardStep] =
    React.useState<ClosingWizardStep>(initialStep ?? 1);
  const [reviewConfirmed, setReviewConfirmed] = React.useState(false);
  const [confirmPhraseInput, setConfirmPhraseInput] = React.useState('');

  const [daftarPeriode, setDaftarPeriode] = React.useState<PeriodeDaftarItem[]>(
    () => initialCachedPeriodeInfo?.daftarPeriode ?? [],
  );
  const [stages, setStages] = React.useState<WorkflowStageItem[]>(
    () => initialCachedBundle?.stages ?? [],
  );
  const [pratinjau, setPratinjau] = React.useState<PratinjauData | null>(
    () => initialCachedBundle?.pratinjau ?? null,
  );
  const [standAngkatList, setStandAngkatList] = React.useState<
    StandAngkatMutasiItem[]
  >(() => initialCachedBundle?.standAngkatList ?? []);
  const [perbandingan, setPerbandingan] =
    React.useState<PerbandinganPeriodeData | null>(
      () => initialCachedBundle?.perbandingan ?? null,
    );

  // `loading` hanya bernilai true saat belum ada data sama sekali di cache (cold load awal).
  // Saat pindah tab atau refresh manual, data tetap utuh di layar dan hanya `refreshing` yang aktif.
  const [loading, setLoading] = React.useState(() => !initialCachedBundle);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<OperatorFeedback | null>(null);

  const [activeDialog, setActiveDialog] =
    React.useState<ActiveClosingDialog>(() =>
      initialTab === 'bulan-baru' ? 'bulan-baru' : null,
    );
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = React.useState(() =>
    computeDefaultDueDate(initialPeriode),
  );
  const [targetBulanBaru, setTargetBulanBaru] = React.useState(() =>
    computeNextPeriode(initialPeriode),
  );

  const hasRestoredSessionRef = React.useRef(Boolean(initialStep));
  const reviewConfirmedRef = React.useRef(reviewConfirmed);
  const tanggalJatuhTempoRef = React.useRef(tanggalJatuhTempo);
  reviewConfirmedRef.current = reviewConfirmed;
  tanggalJatuhTempoRef.current = tanggalJatuhTempo;

  // Sinkronkan bila tab lain mengubah periode aktif di memori bersama
  React.useEffect(() => {
    return subscribeSharedClosingPeriode((nextPeriode) => {
      setPeriodeState((prev) => {
        if (prev === nextPeriode) return prev;
        setTanggalJatuhTempo(computeDefaultDueDate(nextPeriode));
        setTargetBulanBaru(computeNextPeriode(nextPeriode));
        return nextPeriode;
      });
    });
  }, []);

  // 1. Pulihkan sesi lokal & muat daftar periode kerja (deduplicated + cached)
  React.useEffect(() => {
    let cancelled = false;
    const syncedPeriode = getSharedClosingPeriode();

    try {
      const savedSession = window.sessionStorage.getItem(
        CLOSING_SESSION_STATE_KEY,
      );
      if (savedSession) {
        const parsed = JSON.parse(savedSession) as Partial<StoredSessionState>;
        if (parsed.periode && /^\d{6}$/.test(parsed.periode)) {
          setSharedClosingPeriode(parsed.periode);
          if (parsed.periode !== periode) {
            setPeriodeState(parsed.periode);
            setTargetBulanBaru(computeNextPeriode(parsed.periode));
          }
        }
        if (
          !initialStep &&
          parsed.activeWizardStep &&
          [1, 2, 3, 4].includes(parsed.activeWizardStep)
        ) {
          setActiveWizardStep(parsed.activeWizardStep);
          hasRestoredSessionRef.current = true;
        }
        if (typeof parsed.reviewConfirmed === 'boolean') {
          setReviewConfirmed(parsed.reviewConfirmed);
        }
        if (parsed.tanggalJatuhTempo) {
          setTanggalJatuhTempo(parsed.tanggalJatuhTempo);
        } else if (syncedPeriode) {
          setTanggalJatuhTempo(computeDefaultDueDate(syncedPeriode));
        }
      }
    } catch {
      // Abaikan jika storage diblokir browser
    }

    fetchPeriodeKerjaInfo().then((info) => {
      if (cancelled || !info) return;
      if (info.daftarPeriode?.length) {
        setDaftarPeriode(info.daftarPeriode);
      }
      const activeShared = getSharedClosingPeriode();
      if (activeShared && activeShared !== periode) {
        setPeriodeState(activeShared);
        setTanggalJatuhTempo(computeDefaultDueDate(activeShared));
        setTargetBulanBaru(computeNextPeriode(activeShared));
      }
    });

    return () => {
      cancelled = true;
    };
    // Hanya dijalankan saat mount awal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, initialStep]);

  // 2. Simpan progres lokal ke sessionStorage TANPA memicu re-fetch API!
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
      // Abaikan
    }
  }, [periode, activeWizardStep, reviewConfirmed, tanggalJatuhTempo]);

  // 3. Fungsi pemuat data dengan Stale-While-Revalidate (TIDAK bergantung pada reviewConfirmed / tanggalJatuhTempo!)
  const fetchAndApplyBundle = React.useCallback(
    async (targetPeriode: string, options?: { force?: boolean }) => {
      const cached = getCachedClosingBundle(targetPeriode);
      if (cached) {
        setStages(cached.stages);
        setPratinjau(cached.pratinjau);
        setStandAngkatList(cached.standAngkatList);
        setPerbandingan(cached.perbandingan);
        setLoading(false);
        if (!options?.force && isClosingBundleFresh(targetPeriode)) {
          setRefreshing(false);
          return;
        }
        setRefreshing(true);
      } else {
        // Hanya set loading penuh jika belum ada pratinjau sama sekali di layar
        setPratinjau((prev) => {
          if (!prev) setLoading(true);
          else setRefreshing(true);
          return prev;
        });
      }

      try {
        const bundle = await fetchClosingBundle(targetPeriode, options);
        setStages(bundle.stages);
        setPratinjau(bundle.pratinjau);
        setStandAngkatList(bundle.standAngkatList);
        setPerbandingan(bundle.perbandingan);

        if (bundle.pratinjau?.audit?.tanggalJatuhTempo) {
          const savedIso = bundle.pratinjau.audit.tanggalJatuhTempo.slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(savedIso)) {
            setTanggalJatuhTempo(savedIso);
          }
        }

        const evalResult = evaluateClosingWizardSteps({
          stages: bundle.stages,
          pratinjau: bundle.pratinjau,
          standAngkatList: bundle.standAngkatList,
          reviewConfirmed: reviewConfirmedRef.current,
          tanggalJatuhTempo: tanggalJatuhTempoRef.current,
        });

        if (bundle.pratinjau?.status === 'TERKUNCI') {
          setActiveWizardStep(4);
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
        setRefreshing(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void fetchAndApplyBundle(periode);
  }, [periode, fetchAndApplyBundle]);

  const loadClosingData = React.useCallback(async () => {
    await fetchAndApplyBundle(periode, { force: true });
  }, [periode, fetchAndApplyBundle]);

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
      });
      setActiveDialog(null);
      await fetchAndApplyBundle(periode, { force: true });
      setActiveWizardStep(3);
    } catch (err) {
      setFeedback(
        buildOperatorErrorFeedback(err, 'Gagal Mengesahkan Bacaan Meter'),
      );
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, periode, fetchAndApplyBundle]);

  const handleEksekusiClosing = React.useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await executeClosingPeriode(periode, tanggalJatuhTempo);
      setFeedback({
        type: 'success',
        title: `Tutup Buku Periode ${periode} Selesai & Terkunci`,
        message: `Berhasil menerbitkan ${formatAngkaId(res.jumlahSl)} rekening tagihan air resmi senilai ${formatRupiahId(res.totalTagihan ?? pratinjau?.perkiraan.totalTagihan)}.`,
      });
      setConfirmPhraseInput('');
      setActiveDialog(null);
      await fetchAndApplyBundle(periode, { force: true });
      setActiveWizardStep(4);
    } catch (err) {
      setFeedback(
        buildOperatorErrorFeedback(err, 'Tutup Buku Tidak Dapat Diselesaikan'),
      );
    } finally {
      setActionLoading(false);
    }
  }, [
    actionLoading,
    periode,
    tanggalJatuhTempo,
    pratinjau,
    fetchAndApplyBundle,
  ]);

  const handleBukaBulanBaru = React.useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await initializeBulanBaru(periode, targetBulanBaru);
      setFeedback({
        type: 'success',
        title: `Jadwal Bulan Baru ${formatPeriodeLabelId(targetBulanBaru)} (${targetBulanBaru}) Siap Digunakan`,
        message: res.message,
      });
      setActiveDialog(null);
      const info = await fetchPeriodeKerjaInfo({ force: true });
      if (info?.daftarPeriode?.length) {
        setDaftarPeriode(info.daftarPeriode);
      }
      await fetchAndApplyBundle(periode, { force: true });
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
  }, [actionLoading, periode, targetBulanBaru, fetchAndApplyBundle]);

  const handleVerifikasiStandAngkat = React.useCallback(
    async (id: string, status: StandAngkatDecisionStatus) => {
      if (actionLoading) return;
      setActionLoading(true);
      try {
        const res = await verifyStandAngkatMutasi(id, status);
        setFeedback({
          type: 'success',
          title: 'Status Pergantian Meter Diperbarui',
          message: res.message,
        });
        await fetchAndApplyBundle(periode, { force: true });
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
    [actionLoading, periode, fetchAndApplyBundle],
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
        const dpmTargetPeriode =
          pratinjau?.status === 'TERKUNCI' ? targetBulanBaru : periode;

        let res: { message: string } | null = null;
        if (stageId === 'update-zonasi') {
          res = await executeUpdateZonasi(periode);
        } else if (stageId === 'upload-master-pelanggan') {
          res = await executeUploadMasterPelanggan(periode);
        } else if (stageId === 'sync-pelanggan-baru') {
          res = await executeSyncPelangganBaru(dpmTargetPeriode);
        } else if (stageId === 'update-data-pelanggan') {
          res = await executeUpdateDataPelanggan(dpmTargetPeriode);
        }

        if (res) {
          setFeedback({
            type: 'success',
            title: 'Penyelarasan Data Berhasil',
            message: res.message,
          });
          await fetchAndApplyBundle(periode, { force: true });
        }
      } catch (err) {
        setFeedback(
          buildOperatorErrorFeedback(
            err,
            'Gagal Menjalankan Penyelarasan Data',
          ),
        );
      } finally {
        setActionLoading(false);
      }
    },
    [
      actionLoading,
      periode,
      targetBulanBaru,
      pratinjau?.status,
      fetchAndApplyBundle,
    ],
  );

  const handlePeriodeChange = React.useCallback((newPeriode: string) => {
    setSharedClosingPeriode(newPeriode);
    setPeriodeState(newPeriode);
    setReviewConfirmed(false);
    setConfirmPhraseInput('');
    if (/^\d{6}$/.test(newPeriode)) {
      setTanggalJatuhTempo(computeDefaultDueDate(newPeriode));
      setTargetBulanBaru(computeNextPeriode(newPeriode));
    }
    hasRestoredSessionRef.current = false;
  }, []);

  return {
    periode,
    daftarPeriode,
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
