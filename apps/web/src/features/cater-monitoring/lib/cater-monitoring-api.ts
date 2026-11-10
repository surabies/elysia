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
}> {
  const [petugasProgress, extremeReadings, zeroReadings] = await Promise.all([
    fetchData<PetugasProgress[]>(`/api/cater/progress/cater/${period}`),
    fetchData<ReadingReviewItem[]>(
      `/api/cater/progress/ekstrim/${period}?limit=10`,
    ),
    fetchData<ReadingReviewItem[]>(
      `/api/cater/progress/pemakaian-nol/${period}?limit=10`,
    ),
  ]);
  return { petugasProgress, extremeReadings, zeroReadings };
}
