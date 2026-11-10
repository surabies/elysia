export interface CaterStats {
  totalPelanggan: number;
  totalRute: number;
  totalPetugas: number;
  totalTercatat: number;
  periodeTerakhir: string | null;
  totalPakaiM3?: number;
  totalTagihan?: number;
  totalTunggakan?: number;
  kondisiBreakdown?: Array<{ kondisi: string | null; count: number }>;
}

export interface RouteSummary {
  kode: string;
  seksiNama: string | null;
  petugasDefault: string | null;
  customerCount: number;
}

export interface PetugasProgress {
  petugasId: string;
  petugasNama: string;
  totalTercatat: number;
  totalPakaiM3: number;
  totalNormal: number;
  totalKelainan: number;
}

export interface ReadingReviewItem {
  id: string;
  nolg: string;
  nama: string;
  ruteKode: string | null;
  stml: number | string | null;
  stma: number | string | null;
  pakaiM3: number | string | null;
  pakaiLalu?: number | string | null;
  selisihM3?: number | null;
  persenDeviasi?: number | null;
  rataRataHistoris?: number | null;
  ketCatat?: string | null;
  petugasNama?: string | null;
  statusVerifikasi?: string | null;
  fotoMeterUrl?: string | null;
  fotoRumahUrl?: string | null;
  tglCatat?: string | Date | null;
  jenisAnomali?: 'EKSTRIM' | 'NOL' | 'TURUN' | 'KENDALA';
}

export interface AnomaliKPI {
  totalAnomali: number;
  totalEkstrim: number;
  totalNol: number;
  totalTurun: number;
}

export interface AnomaliOverviewData {
  periode: string;
  kpi: AnomaliKPI;
  items: ReadingReviewItem[];
}
