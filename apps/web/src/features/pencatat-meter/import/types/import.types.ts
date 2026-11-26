// features/dashboard/import/types/import.types.ts

/* ---------- Respons API ---------- */

export interface ImportApiBase {
  success: boolean;
  error?: string;
}

export interface ImportSampleResponse<TRow> extends ImportApiBase {
  rows?: TRow[];
  csvText?: string;
  message?: string;
}

export interface ImportBatchStats {
  total: number;
  sukses: number;
  gagal: number;
}

export interface ImportProgressState {
  isActive: boolean;
  total: number;
  processed: number;
  sukses: number;
  gagal: number;
  percent: number;
  currentLabel?: string;
  stage: "reading" | "uploading" | "completed";
  customTitle?: string;
  customDescription?: string;
  isCancelling?: boolean;
}

/* ---------- PBPK ---------- */

export type PbpkMutasi = "PB" | "PK";

export interface PbpkRow {
  nolg: string;
  nama: string;
  alamat: string;
  rt?: string;
  rw?: string;
  notelp?: string;
  jmlpenghuni?: number;
  nometer?: string;
  kd_merkmeter?: string;
  kd_ukmeter?: string;
  tglaktif?: string;
  kd_kelurahan?: string;
  kd_kecamatan?: string;
  kode_wilayah?: string;
  kd_rute?: string;
  kd_goltarif?: string;
  no_urutrute?: number;
  mutasian: PbpkMutasi;
}

export interface PbpkResultStats extends ImportBatchStats {
  pb: number;
  pk: number;
}

export interface PbpkImportResponse extends ImportApiBase {
  data?: Partial<PbpkResultStats>;
}

/* ---------- R-Nomor ---------- */

export interface RNomorRow {
  nolg: string;
  nama: string;
  alamat: string;
  tglPutus: string;
  nomorBa: string;
  standCabut: number;
  alasan: string;
}

export interface BatchImportResponse extends ImportApiBase {
  data?: Partial<ImportBatchStats>;
}

/* ---------- Data Pencatatan (mobile) ---------- */

export interface PencatatanRow {
  thbl: string;
  nolg: string;
  stml: number;
  stma: number;
  pakaiM3: number;
  tglCatat: string;
  petugasId: string;
  ruteKode: string;
  ketCatat: string;
  latitude?: number;
  longitude?: number;
  catatan?: string;
}

/* ---------- LapDataMeter ---------- */

export interface LapDataMeterRow {
  thbl: string;
  nolg: string;
  nama?: string;
  stml: number;
  stma: number;
  pakaiM3: number;
  pakaiLalu?: number;
  tmss?: string;
  ketCatat: string;
  petugasId?: string;
  namaPetugas?: string;
  ruteKode?: string;
  tglCatat: string;
  catatan?: string;
}

export interface LapDataMeterResultStats extends ImportBatchStats {
  created: number;
  updated: number;
  skipped: number;
}

export interface LapDataMeterImportResponse extends ImportApiBase {
  sukses?: number;
  gagal?: number;
  created?: number;
  updated?: number;
  skipped?: number;
}

/* ---------- Foto Backup ---------- */

export interface LookupPelangganRow {
  nolg: string;
  nama: string;
  alamat: string;
  ruteKode?: string;
}

export interface LookupPelangganResponse extends ImportApiBase {
  data?: LookupPelangganRow[];
}

export interface FotoBackupUploadResponse extends ImportApiBase {
  data?: { sukses?: number; gagal?: number };
}
