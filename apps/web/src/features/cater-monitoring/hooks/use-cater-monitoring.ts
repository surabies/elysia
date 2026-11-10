'use client';

import { useEffect, useState } from 'react';
import {
  fetchCaterOverviewData,
  fetchCaterPeriodData,
} from '../lib/cater-monitoring-api';
import type {
  CaterStats,
  PetugasProgress,
  ReadingReviewItem,
  RouteSummary,
} from '../types';

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
    fetchCaterOverviewData()
      .then(({ stats: nextStats, routes: nextRoutes }) => {
        if (!active) return;
        setStats(nextStats);
        setRoutes(nextRoutes);
        const latestPeriod = nextStats.periodeTerakhir;
        if (latestPeriod && /^\d{6}$/.test(latestPeriod)) {
          setMonth(`${latestPeriod.slice(0, 4)}-${latestPeriod.slice(4)}`);
        } else {
          const now = new Date();
          setMonth(
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          );
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setOverviewError(
            error instanceof Error ? error.message : 'Gagal memuat ringkasan.',
          );
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
    fetchCaterPeriodData(period)
      .then(({ petugasProgress: progress, extremeReadings: extreme, zeroReadings: zero }) => {
        if (!active) return;
        setPetugasProgress(progress);
        setExtremeReadings(extreme);
        setZeroReadings(zero);
      })
      .catch((error: unknown) => {
        if (active)
          setPeriodError(
            error instanceof Error ? error.message : 'Gagal memuat periode.',
          );
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
