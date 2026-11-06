/**
 * @cater/types - Shared Domain Interfaces & DTOs for Baca Meter (Cater)
 * Derived from STI PDAM ProgresCater & PBPK specifications
 */

// --- Status & Enums ---
export type KondisiCatat =
  | 'Normal'
  | 'Terhalang'
  | 'Rumah Kosong'
  | 'Meter Rusak'
  | 'Meter Hilang'
  | 'Meter Buram'
  | 'Terkunci'
  | 'MTA'
  | 'Tidak Dipakai';

export type MetodeCatat = 'ONSITE' | 'OFFSITE';

// 6 Tingkatan Hirarki Jabatan Kepegawaian (HR)
export type EmployeeLevel =
  | 'DIREKSI'
  | 'SENIOR_MANAGER'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'STAFF_PENYELIA'
  | 'PELAKSANA';

// Peran Sistem RBAC
export type AppRole =
  | 'SUPERADMIN'
  | 'EXECUTIVE'
  | 'VERIFIKATOR_3'
  | 'VERIFIKATOR_2'
  | 'VERIFIKATOR_1'
  | 'STAFF_ADMIN_BILLING'
  | 'PENCATAT';

// Status Siklus Verifikasi Baca Meter (3-Tier + Staff Correction)
export type CaterVerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NEED_RESURVEY'
  | 'VERIFIED_L1'
  | 'VERIFIED_L2'
  | 'APPROVED_FINAL'
  | 'CORRECTED_POST_VERIF'
  | 'LOCKED_BILLING';

export type StatusVerifikasi =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ANOMALY_HIGH'
  | 'ANOMALY_LOW'
  | 'REVISED'
  | CaterVerificationStatus;

export type StatusPelanggan = 'AKTIF' | 'SEGEL' | 'PUTUS' | 'TIDAK_AKTIF';

// --- RBAC & Kepegawaian Domain Models ---
export interface Pegawai {
  id: string;
  userId?: string | null;
  nip: string;
  namaLengkap: string;
  level: EmployeeLevel;
  jabatanNama?: string | null;
  unitKerja?: string | null;
  atasanId?: string | null;
  noHp?: string | null;
  aktif: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserRoleRecord {
  userId: string;
  role: AppRole;
  createdAt: Date | string;
}

export interface UserWilayahScope {
  userId: string;
  wiladmKode: string;
  createdAt: Date | string;
}

export interface UserRuteAssignment {
  userId: string;
  ruteKode: string;
  periodeThbl: string;
  createdAt: Date | string;
}

export interface CaterVerifikasiLog {
  id: string;
  caterId: string;
  userId: string;
  stage: 'V1' | 'V2' | 'V3' | 'STAFF_CORRECTION';
  action: 'APPROVE' | 'REQUEST_RESURVEY' | 'ADJUST_STAND' | 'STAFF_POST_CORRECT';
  stmaSebelum?: string | number | null;
  stmaSesudah?: string | number | null;
  pakaiSebelum?: string | number | null;
  pakaiSesudah?: string | number | null;
  nomorTiketKomplain?: string | null;
  alasan: string;
  createdAt: Date | string;
}

// --- Domain Models ---
export interface WilayahAdministrasi {
  kode: string; // e.g. 'C', 'K'
  nama: string; // e.g. 'CIBEUNYING', 'KAREES'
}

export interface Kecamatan {
  kode: string; // e.g. 'CD'
  nama: string; // e.g. 'SUMUR BANDUNG'
  wiladmKode: string;
}

export interface Kelurahan {
  kode: string; // e.g. 'CD1'
  nama: string; // e.g. 'BRAGA'
  kecamatanKode: string;
}

export interface RuteCater {
  kode: string; // e.g. 'CD104', 'KC207'
  seksiKode?: string; // e.g. 'C4'
  seksiNama?: string;
  pencatatDefault?: string;
}

export interface PetugasCater {
  id: string;
  nama: string;
  noHp?: string;
  aktif: boolean;
}

export interface GolonganTarif {
  kode: string; // e.g. '2A1', '2A4', '3B'
  nama: string;
  beaBeban: number;
  beaAdmin: number;
  airKotor: number;
  lainLain?: number;
}

export interface WaterMeterAsset {
  noMeter: string;
  merk: string; // e.g. 'ITR', 'LIN'
  ukuran: string; // e.g. '1/2', '3/4'
  noSegel?: string;
  tglPasang?: string;
  umurTahun?: number;
  umurBulan?: number;
  kondisi: string;
}

export interface Pelanggan {
  nolg: string; // Nomor Langganan (Primary Key)
  nprs?: string;
  nama: string;
  alamat: string;
  rt?: string;
  rw?: string;
  notelp?: string;
  jmlPenghuni?: number;
  isMbr: boolean;
  status: StatusPelanggan;
  tarifKode: string;
  ruteKode: string;
  noUrutRute?: number;
  noMeter?: string;
  longitude?: number;
  latitude?: number;
}

export interface CaterBacaMeterInput {
  thbl: string; // e.g. '202601'
  nolg: string;
  ruteKode: string;
  petugasId: string;
  stml: number; // Stand Meter Lalu
  stma: number; // Stand Meter Akhir
  kondisiCatat: KondisiCatat;
  metodeCatat: MetodeCatat;
  fotoMeterUrl?: string;
  fotoRumahUrl?: string;
  longitude?: number;
  latitude?: number;
  durasiDetik?: number;
  keterangan?: string;
}

export interface CaterProgressSummary {
  thbl: string;
  ruteKode: string;
  totalPelanggan: number;
  tercatat: number;
  belumTercatat: number;
  anomali: number;
  persentaseSelesai: number;
}

export interface BillingDrd {
  thbl: string;
  nolg: string;
  pakaiM3: number;
  jmlHargaAir: number;
  beaBeban: number;
  beaAdmin: number;
  airKotor: number;
  totalTagihan: number;
  jmlRekNunggak: number;
  tagNunggak: number;
}

export interface VerifyCaterInput {
  caterId: string;
  action: 'APPROVE' | 'REQUEST_RESURVEY' | 'ADJUST_STAND';
  stmaKoreksi?: number;
  catatan?: string;
}

export interface StaffCorrectionInput {
  caterId: string;
  stmaBaru: number;
  pakaiM3Baru: number;
  nomorTiketKomplain?: string;
  alasan: string;
}
