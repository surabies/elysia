'use client';

import * as React from 'react';
import type { FeedbackNotice } from '@/features/dashboard/shared/components';
import { fetchCekSelisihData } from '../lib/closing-api';
import { DEFAULT_CLOSING_PERIODE } from '../lib/closing-format';
import type { CekSelisihData, RekonsiliasiRuteStatus } from '../types';

export type FilterRekonsiliasiStatus = 'SEMUA' | RekonsiliasiRuteStatus;

export function useCekSelisih() {
  const [periode, setPeriode] = React.useState(DEFAULT_CLOSING_PERIODE);
  const [data, setData] = React.useState<CekSelisihData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState<FeedbackNotice | null>(null);

  const [searchRute, setSearchRute] = React.useState('');
  const [filterStatus, setFilterStatus] =
    React.useState<FilterRekonsiliasiStatus>('SEMUA');

  const loadCekSelisih = React.useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetchCekSelisihData(periode);
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
    }
  }, [periode]);

  React.useEffect(() => {
    loadCekSelisih();
  }, [loadCekSelisih]);

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
    setPeriode,
    data,
    loading,
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
