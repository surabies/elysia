export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusVerifikasi?: string;
}

export interface RouteSummary {
  kode: string;
  seksiNama: string | null;
  petugasDefault: string | null;
  customerCount: number;
}

export interface Customer {
  nolg: string;
  nama: string;
  alamat: string | null;
  noMeter: string | null;
  readingId: string | null;
  stml: number | string | null;
  pakaiLalu: number | string | null;
  stmaTerakhir: number | string | null;
  statusVerifikasi: string | null;
  standSebelumnya: number | string | null;
  pakaiSebelumnya: number | string | null;
}

export interface ReadingResult {
  id: string;
  nolg: string;
  stml: number | string;
  stma: number | string;
  pakaiM3: number | string;
  statusVerifikasi: string;
}

export interface AuditEntry {
  id: string;
  stage: string;
  action: string;
  alasan: string;
  createdAt: string;
}

export type ReadingScenario = 'normal' | 'high' | 'reverse' | 'zero';
