'use client';

import * as React from 'react';
import type { FeedbackNotice } from '@/features/dashboard/shared/components';
import {
  fetchPbpkData,
  submitPasangBaru,
  submitPerubahanKategori,
} from '../lib/closing-api';
import { DEFAULT_CLOSING_PERIODE } from '../lib/closing-format';
import type {
  CreatePasangBaruPayload,
  CreatePerubahanKategoriPayload,
  PbpkData,
} from '../types';

export function usePbpkManager() {
  const [periode, setPeriode] = React.useState(DEFAULT_CLOSING_PERIODE);
  const [data, setData] = React.useState<PbpkData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<FeedbackNotice | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showPbDialog, setShowPbDialog] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetchPbpkData(periode);
      setData(res);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memuat data PBPK.',
      });
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSimpanPasangBaru = React.useCallback(
    async (payload: CreatePasangBaruPayload): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await submitPasangBaru(payload);
        setFeedback({ type: 'success', message: res.message });
        setShowPbDialog(false);
        await loadData();
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
    [loadData],
  );

  const handleSimpanPerubahanKategori = React.useCallback(
    async (payload: CreatePerubahanKategoriPayload): Promise<boolean> => {
      setActionLoading(true);
      try {
        const res = await submitPerubahanKategori(payload);
        setFeedback({ type: 'success', message: res.message });
        await loadData();
        return true;
      } catch (err) {
        setFeedback({
          type: 'error',
          message:
            err instanceof Error
              ? err.message
              : 'Gagal mengubah kategori tarif.',
        });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [loadData],
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
    setPeriode,
    data,
    loading,
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
  };
}
