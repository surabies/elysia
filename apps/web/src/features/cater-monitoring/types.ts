export interface CaterStats {
  totalPelanggan: number;
  totalRute: number;
  totalPetugas: number;
  totalTercatat: number;
  periodeTerakhir: string | null;
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
}
