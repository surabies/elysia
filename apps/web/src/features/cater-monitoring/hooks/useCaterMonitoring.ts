'use client';

import { useEffect, useState } from 'react';
import type {
  CaterStats,
  PetugasProgress,
  ReadingReviewItem,
  RouteSummary,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.error || `Permintaan gagal (${response.status})`);
  }
  return result.data;
}

export function useCaterMonitoring() {
  const [stats, setStats] = useState<CaterStats | null>(null);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [month, setMonth] = useState('');
  const [petugasProgress, setPetugasProgress] = useState<PetugasProgress[]>([]);
  const [extremeReadings, setExtremeReadings] = useState<ReadingReviewItem[]>([]);
  const [zeroReadings, setZeroReadings] = useState<ReadingReviewItem[]>([]);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchData<CaterStats>('/api/cater/stats'),
      fetchData<RouteSummary[]>('/api/cater/routes?limit=500'),
    ])
      .then(([nextStats, nextRoutes]) => {
        if (!active) return;
        setStats(nextStats);
        setRoutes(nextRoutes);
        const latestPeriod = nextStats.periodeTerakhir;
        if (latestPeriod && /^\d{6}$/.test(latestPeriod)) {
          setMonth(`${latestPeriod.slice(0, 4)}-${latestPeriod.slice(4)}`);
        } else {
          const now = new Date();
          setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setOverviewError(error instanceof Error ? error.message : 'Gagal memuat ringkasan.');
        }
      })
      .finally(() => {
        if (active) setOverviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!month) return;
    let active = true;
    const period = month.replace('-', '');
    setPeriodLoading(true);
    setPeriodError(null);
    Promise.all([
      fetchData<PetugasProgress[]>(`/api/cater/progress/cater/${period}`),
      fetchData<ReadingReviewItem[]>(`/api/cater/progress/ekstrim/${period}?limit=10`),
      fetchData<ReadingReviewItem[]>(`/api/cater/progress/pemakaian-nol/${period}?limit=10`),
    ])
      .then(([progress, extreme, zero]) => {
        if (!active) return;
        setPetugasProgress(progress);
        setExtremeReadings(extreme);
        setZeroReadings(zero);
      })
      .catch((error: unknown) => {
        if (active) setPeriodError(error instanceof Error ? error.message : 'Gagal memuat periode.');
      })
      .finally(() => {
        if (active) setPeriodLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month]);

  return {
    stats,
    routes,
    overviewLoading,
    overviewError,
    month,
    setMonth,
    petugasProgress,
    extremeReadings,
    zeroReadings,
    periodLoading,
    periodError,
  };
}
