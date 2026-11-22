// apps/web/src/features/dashboard/import/types/foto-backup.types.ts

export type ModeImportFilter = "all" | "stand" | "segel" | "rumah";

export interface ParsedPhotoItem {
  fileName: string;
  thbl: string;
  jenis: "stand" | "segel" | "rumah";
  nolg: string;
  url: string;
  size: string;
  valid: boolean;
}

export interface CustomerPhotoGroup {
  nolg: string;
  thbl: string;
  nama?: string;
  alamat?: string;
  ruteKode?: string;
  fotoStand?: ParsedPhotoItem;
  fotoSegel?: ParsedPhotoItem;
  fotoRumah?: ParsedPhotoItem;
  countLengkap: number;
}

export interface ImportProgressState {
  isActive: boolean;
  total: number;
  processed: number;
  sukses: number;
  gagal: number;
  percent: number;
  currentFileName?: string;
  currentLabel?: string;
  stage: "reading" | "uploading" | "completed";
  customTitle?: string;
  customDescription?: string;
}
