'use client';

import * as React from 'react';
import type { FeedbackNotice } from '@/features/penagihan/closing/components/shared';
import {
  fetchCekSelisihData,
  fetchPeriodeKerjaInfo,
} from '../lib/closing-api';
import {
  getCachedCekSelisihData,
  getCachedPeriodeInfo,
  getSharedClosingPeriode,
  isCekSelisihDataFresh,
  setSharedClosingPeriode,
  subscribeSharedClosingPeriode,
} from '../lib/closing-cache';
import type {
  CekSelisihData,
  PeriodeDaftarItem,
  RekonsiliasiRuteStatus,
} from '../types';

export type FilterRekonsiliasiStatus = 'SEMUA' | RekonsiliasiRuteStatus;

export function useCekSelisih() {
  const initialPeriode = getSharedClosingPeriode({ ssrSafe: true });
  const initialCachedData = getCachedCekSelisihData(initialPeriode);
  const initialCachedInfo = getCachedPeriodeInfo();

  const [periode, setPeriodeState] = React.useState(initialPeriode);
  const [daftarPeriode, setDaftarPeriode] = React.useState<PeriodeDaftarItem[]>(
    () => initialCachedInfo?.daftarPeriode ?? [],
  );
  const [data, setData] = React.useState<CekSelisihData | null>(
    () => initialCachedData,
  );
  const [loading, setLoading] = React.useState(() => !initialCachedData);
  const [refreshing, setRefreshing] = React.useState(false);
  const [feedback, setFeedback] = React.useState<FeedbackNotice | null>(null);

  const [searchRute, setSearchRute] = React.useState('');
  const [filterStatus, setFilterStatus] =
    React.useState<FilterRekonsiliasiStatus>('SEMUA');

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
      const cached = getCachedCekSelisihData(targetPeriode);
      if (cached) {
        setData(cached);
        setLoading(false);
        if (!options?.force && isCekSelisihDataFresh(targetPeriode)) {
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
        const res = await fetchCekSelisihData(targetPeriode, options);
        setData(res);
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Gagal memuat data rekonsiliasi pelanggan.',
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

  const loadCekSelisih = React.useCallback(async () => {
    setFeedback(null);
    await fetchAndApply(periode, { force: true });
  }, [periode, fetchAndApply]);

  const setPeriode = React.useCallback((next: string) => {
    setSharedClosingPeriode(next);
    setPeriodeState(next);
  }, []);

  const filteredRutes = React.useMemo(() => {
    const list = data?.ruteBreakdown ?? [];
    const q = searchRute.trim().toLowerCase();
    return list.filter((r) => {
      const matchSearch =
        !q ||
        r.ruteKode.toLowerCase().includes(q) ||
        r.namaRute.toLowerCase().includes(q);
      const matchStatus =
        filterStatus === 'SEMUA' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, searchRute, filterStatus]);

  return {
    periode,
    daftarPeriode,
    setPeriode,
    data,
    loading,
    refreshing,
    feedback,
    setFeedback,
    searchRute,
    setSearchRute,
    filterStatus,
    setFilterStatus,
    filteredRutes,
    isMatch: data?.ringkasan.statusRekonsiliasi === 'MATCH',
    loadCekSelisih,
  };
}
