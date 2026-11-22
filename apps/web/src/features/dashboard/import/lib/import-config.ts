// features/dashboard/import/lib/import-config.ts
// Satu-satunya tempat untuk endpoint, batas, dan nilai bawaan modul Import.

export const IMPORT_API = {
  pbpk: "/api/import/pbpk",
  pbpkSample: "/api/import/sample/pbpk",
  rNomor: "/api/import/r-nomor",
  data: "/api/import/data",
  lapDataMeter: "/api/import/lapdatameter",
  lapDataMeterSample: "/api/import/sample/lapdatameter",
  fotoBackup: "/api/import/foto-backup",
  lookupPelanggan: "/api/import/lookup-pelanggan",
} as const;

export const IMPORT_ROUTES = {
  pencatatanMeter: "/pencatatan-meter",
} as const;

export const IMPORT_LIMITS = {
  /** Jumlah baris maksimum pada pratinjau tabel PBPK. */
  pbpkPreviewRows: 30,
  /** Jumlah baris maksimum pada pratinjau tabel LapDataMeter. */
  lapDataMeterPreviewRows: 50,
  /** Batas waktu impor LapDataMeter (ms). */
  lapDataMeterTimeoutMs: 120_000,
  /** Ukuran batch pemrosesan LapDataMeter (baris per batch ke backend). */
  lapDataMeterBatchSize: 500,
  /** Batas waktu per-batch impor LapDataMeter (ms). */
  lapDataMeterBatchTimeoutMs: 60_000,
  /** Jumlah berkas foto per permintaan unggah. */
  fotoBatchSize: 4,
  /** Jeda agar status 100% sempat terlihat sebelum modal ditutup (ms). */
  progressSettleMs: 450,
} as const;

export const PBPK_DEFAULTS = {
  tarif: "2A2",
  rute: "99999",
  alamat: "-",
  nama: "Pelanggan Baru",
  nolgPrefix: "CUST",
  meterPrefix: "MTR",
} as const;

export const PENCATATAN_DEFAULTS = {
  petugasId: "PETUGAS_LAPANGAN",
  ruteKode: "-",
  ketCatat: "Normal",
  catatan: "Import Stand Meter",
} as const;

export const LAPDATAMETER_DEFAULTS = {
  tmss: "-",
  ketCatat: "Normal",
  catatan: "Import Laporan Data Meter",
  sampleLabel: "lapdatametertes.csv (Sample Resmi)",
} as const;

/** Kata kunci kondisi pembacaan yang dianggap normal. */
export const KONDISI_NORMAL_KEYWORD = "normal";

/* ---------- Foto backup ---------- */

export const FOTO_FILENAME_PATTERN =
  /^(\d{6})_(stand|segel|rumah)_([a-zA-Z0-9_-]+)\.(jpg|jpeg|png|webp)$/i;
export const FOTO_FILENAME_TEMPLATE = "{THBL}_{JENIS}_{NOLG}.jpg";
export const FOTO_EXAMPLE_NOLG = "00703600750";
export const FOTO_MOCK_DIR = "packages/db/data/mock-photos/";
