import type {
  AnomaliKPI,
  AnomaliOverviewData,
  CaterStats,
  PetugasProgress,
  ReadingReviewItem,
  RouteSummary,
} from '../types';
import type { ItemRuteBaca } from '../types/RiwayatPembacaanTypes';

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

export async function fetchCaterOverviewData(): Promise<{
  stats: CaterStats;
  routes: RouteSummary[];
}> {
  const [stats, routes] = await Promise.all([
    fetchData<CaterStats>('/api/cater/stats'),
    fetchData<RouteSummary[]>('/api/cater/routes?limit=500'),
  ]);
  return { stats, routes };
}

export async function fetchCaterPeriodData(period: string): Promise<{
  petugasProgress: PetugasProgress[];
  extremeReadings: ReadingReviewItem[];
  zeroReadings: ReadingReviewItem[];
  downReadings: ReadingReviewItem[];
  anomaliKPI: AnomaliKPI;
  allAnomaliItems: ReadingReviewItem[];
  riwayatSesi: ItemRuteBaca[];
}> {
  const [
    petugasProgress,
    anomaliRes,
    extremeRes,
    zeroRes,
    downRes,
    riwayatSesi,
  ] = await Promise.all([
    fetchData<PetugasProgress[]>(`/api/cater/progress/cater/${period}`).catch(() => []),
    fetchData<AnomaliOverviewData>(`/api/cater/progress/anomali?thbl=${period}&limit=1`).catch(() => null),
    fetchData<ReadingReviewItem[]>(`/api/cater/progress/ekstrim/${period}?limit=100`).catch(() => []),
    fetchData<ReadingReviewItem[]>(`/api/cater/progress/pemakaian-nol/${period}?limit=100`).catch(() => []),
    fetchData<ReadingReviewItem[]>(`/api/cater/progress/turun/${period}?limit=100`).catch(() => []),
    fetchData<ItemRuteBaca[]>(`/api/cater/progress/riwayat-sesi/${period}`).catch(() => []),
  ]);

  const anomaliKPI: AnomaliKPI = anomaliRes?.kpi ?? {
    totalAnomali: 0,
    totalEkstrim: 0,
    totalNol: 0,
    totalTurun: 0,
  };

  // Pastikan properti jenisAnomali tersemat dengan kuat di setiap kategori
  const extremeReadings = (extremeRes ?? []).map((i) => ({ ...i, jenisAnomali: 'EKSTRIM' as const }));
  const zeroReadings = (zeroRes ?? []).map((i) => ({ ...i, jenisAnomali: 'NOL' as const }));
  const downReadings = (downRes ?? []).map((i) => ({ ...i, jenisAnomali: 'TURUN' as const }));

  // Gabungkan dan deduplikasi ID untuk tampilan 'Semua'
  const seenIds = new Set<string>();
  const allAnomaliItems: ReadingReviewItem[] = [];
  for (const item of [...extremeReadings, ...zeroReadings, ...downReadings]) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      allAnomaliItems.push(item);
    }
  }

  return {
    petugasProgress,
    extremeReadings,
    zeroReadings,
    downReadings,
    anomaliKPI,
    allAnomaliItems,
    riwayatSesi,
  };
}
