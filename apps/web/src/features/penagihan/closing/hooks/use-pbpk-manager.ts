'use client';

import * as React from 'react';
import type { FeedbackNotice } from '@/features/penagihan/closing/components/shared';
import {
  fetchPbpkData,
  fetchPeriodeKerjaInfo,
  submitBacaanPbpk,
  submitPasangBaru,
  submitPerubahanKategori,
} from '../lib/closing-api';
import {
  getCachedPbpkData,
  getCachedPeriodeInfo,
  getSharedClosingPeriode,
  isPbpkDataFresh,
  setSharedClosingPeriode,
  subscribeSharedClosingPeriode,
} from '../lib/closing-cache';
import type {
  CreatePasangBaruPayload,
  CreatePerubahanKategoriPayload,
  PbpkData,
  PeriodeDaftarItem,
  SimpanBacaanPbpkItem,
} from '../types';

export function usePbpkManager() {
  const initialPeriode = getSharedClosingPeriode({ ssrSafe: true });
  const initialCachedData = getCachedPbpkData(initialPeriode);
  const initialCachedInfo = getCachedPeriodeInfo();

  const [periode, setPeriodeState] = React.useState(initialPeriode);
  const [daftarPeriode, setDaftarPeriode] = React.useState<PeriodeDaftarItem[]>(
    () => initialCachedInfo?.daftarPeriode ?? [],
  );
  const [data, setData] = React.useState<PbpkData | null>(
    () => initialCachedData,
  );
  const [loading, setLoading] = React.useState(() => !initialCachedData);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<FeedbackNotice | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showPbDialog, setShowPbDialog] = React.useState(false);

  React.useEffect(() => {
    return subscribeSharedClosingPeriode((next) => {
      setPeriodeState((prev) => (prev === next ? prev : next));
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const synced = getSharedClosingPeriode();
    if (synced && synced !== periode) {
      setPeriodeState(synced);
    }

    fetchPeriodeKerjaInfo().then((info) => {
      if (cancelled || !info) return;
      if (info.daftarPeriode?.length) {
        setDaftarPeriode(info.daftarPeriode);
      }
      const activeShared = getSharedClosingPeriode();
      if (activeShared && activeShared !== periode) {
        setPeriodeState(activeShared);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAndApply = React.useCallback(
    async (targetPeriode: string, options?: { force?: boolean }) => {
      const cached = getCachedPbpkData(targetPeriode);
      if (cached) {
        setData(cached);
        setLoading(false);
        if (!options?.force && isPbpkDataFresh(targetPeriode)) {
          setRefreshing(false);
          return;
        }
        setRefreshing(true);
      } else {
        setData((prev) => {
          if (!prev) setLoading(true);
          else setRefreshing(true);
          return prev;
        });
      }

      try {
        const res = await fetchPbpkData(targetPeriode, options);
        setData(res);
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error ? err.message : 'Gagal memuat data PBPK.',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    void fetchAndApply(periode);
  }, [periode, fetchAndApply]);

  const loadData = React.useCallback(async () => {
    setFeedback(null);
    await fetchAndApply(periode, { force: true });
  }, [periode, fetchAndApply]);

  const setPeriode = React.useCallback((next: string) => {
    setSharedClosingPeriode(next);
    setPeriodeState(next);
  }, []);

  const handleSimpanPasangBaru = React.useCallback(
    async (payload: CreatePasangBaruPayload): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await submitPasangBaru(payload);
        setFeedback({ type: 'success', message: res.message });
        setShowPbDialog(false);
        await fetchAndApply(periode, { force: true });
        return true;
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Gagal menyimpan pasang baru.',
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [periode, fetchAndApply],
  );

  const handleSimpanPerubahanKategori = React.useCallback(
    async (payload: CreatePerubahanKategoriPayload): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await submitPerubahanKategori(payload);
        setFeedback({ type: 'success', message: res.message });
        await fetchAndApply(periode, { force: true });
        return true;
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Gagal memproses mutasi pelanggan.',
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [periode, fetchAndApply],
  );

  const handleSimpanBacaanPbpk = React.useCallback(
    async (items: SimpanBacaanPbpkItem[]): Promise<boolean> => {
      if (items.length === 0) return false;
      setActionLoading(true);
      try {
        const res = await submitBacaanPbpk({ periode, items });
        setFeedback({ type: 'success', message: res.message });
        await fetchAndApply(periode, { force: true });
        return true;
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Gagal menyimpan pemakaian stand PBPK.',
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [periode, fetchAndApply],
  );

  const filteredPb = React.useMemo(() => {
    const list = data?.daftarPasangBaru ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.nolg.toLowerCase().includes(q) ||
        p.nama.toLowerCase().includes(q) ||
        p.alamat.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  return {
    periode,
    daftarPeriode,
    setPeriode,
    data,
    loading,
    refreshing,
    actionLoading,
    feedback,
    setFeedback,
    searchQuery,
    setSearchQuery,
    showPbDialog,
    setShowPbDialog,
    filteredPb,
    loadData,
    handleSimpanPasangBaru,
    handleSimpanPerubahanKategori,
    handleSimpanBacaanPbpk,
  };
}
