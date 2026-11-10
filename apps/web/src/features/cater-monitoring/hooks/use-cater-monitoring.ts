'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchCaterOverviewData,
  fetchCaterPeriodData,
} from '../lib/cater-monitoring-api';
import type {
  AnomaliKPI,
  CaterStats,
  PetugasProgress,
  ReadingReviewItem,
  RouteSummary,
} from '../types';
import type { ItemRuteBaca } from '../types/RiwayatPembacaanTypes';

export interface UseCaterMonitoringOptions {
  initialStats?: CaterStats | null;
  initialRoutes?: RouteSummary[];
  initialRiwayatSesi?: ItemRuteBaca[];
  initialExtremeReadings?: ReadingReviewItem[];
  initialZeroReadings?: ReadingReviewItem[];
  initialDownReadings?: ReadingReviewItem[];
  initialMonth?: string;
}

export function useCaterMonitoring(options: UseCaterMonitoringOptions = {}) {
  const [stats, setStats] = useState<CaterStats | null>(options.initialStats ?? null);
  const [routes, setRoutes] = useState<RouteSummary[]>(options.initialRoutes ?? []);
  const [overviewLoading, setOverviewLoading] = useState(!options.initialStats);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [month, setMonth] = useState(options.initialMonth || '2026-01');
  const [petugasProgress, setPetugasProgress] = useState<PetugasProgress[]>([]);
  const [riwayatSesiList, setRiwayatSesiList] = useState<ItemRuteBaca[]>(
    options.initialRiwayatSesi ?? []
  );
  const [extremeReadings, setExtremeReadings] = useState<ReadingReviewItem[]>(
    options.initialExtremeReadings ?? []
  );
  const [zeroReadings, setZeroReadings] = useState<ReadingReviewItem[]>(
    options.initialZeroReadings ?? []
  );
  const [downReadings, setDownReadings] = useState<ReadingReviewItem[]>(
    options.initialDownReadings ?? []
  );
  const [allAnomaliItems, setAllAnomaliItems] = useState<ReadingReviewItem[]>([]);
  const [anomaliKPI, setAnomaliKPI] = useState<AnomaliKPI>({
    totalAnomali: 0,
    totalEkstrim: 0,
    totalNol: 0,
    totalTurun: 0,
  });
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);

  useEffect(() => {
    if (options.initialStats && options.initialRoutes) return;
    let active = true;
    fetchCaterOverviewData()
      .then(({ stats: nextStats, routes: nextRoutes }) => {
        if (!active) return;
        setStats(nextStats);
        setRoutes(nextRoutes);
        const latestPeriod = nextStats.periodeTerakhir;
        if (latestPeriod && /^\d{6}$/.test(latestPeriod)) {
          setMonth(`${latestPeriod.slice(0, 4)}-${latestPeriod.slice(4)}`);
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
  }, [options.initialStats, options.initialRoutes]);

  const loadPeriodData = useCallback((targetMonth: string) => {
    if (!targetMonth) return;
    const period = targetMonth.replace('-', '');
    setPeriodLoading(true);
    setPeriodError(null);
    fetchCaterPeriodData(period)
      .then(
        ({
          petugasProgress: progress,
          extremeReadings: extreme,
          zeroReadings: zero,
          downReadings: down,
          anomaliKPI: kpi,
          allAnomaliItems: allItems,
          riwayatSesi,
        }) => {
          if (progress && progress.length > 0) setPetugasProgress(progress);
          setExtremeReadings(extreme ?? []);
          setZeroReadings(zero ?? []);
          setDownReadings(down ?? []);
          setAllAnomaliItems(allItems ?? []);
          setAnomaliKPI(kpi);
          if (riwayatSesi && riwayatSesi.length > 0) {
            setRiwayatSesiList(riwayatSesi);
          }
        }
      )
      .catch((error: unknown) => {
        setPeriodError(
          error instanceof Error ? error.message : 'Gagal memuat periode.',
        );
      })
      .finally(() => {
        setPeriodLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPeriodData(month);
  }, [month, loadPeriodData]);

  return {
    stats,
    routes,
    overviewLoading,
    overviewError,
    month,
    setMonth,
    petugasProgress,
    riwayatSesiList,
    extremeReadings,
    zeroReadings,
    downReadings,
    allAnomaliItems,
    anomaliKPI,
    periodLoading,
    periodError,
    refetchPeriod: () => loadPeriodData(month),
  };
}
