/**
 * @cater/types - Shared Domain Interfaces & DTOs for Baca Meter (Cater)
 * Derived from STI PDAM ProgresCater & PBPK specifications
 */

// --- Status & Enums ---
export type KodeTmss =
  | ' '
  | '-'
  | 'H'
  | 'R'
  | 'N'
  | 'Z'
  | 'P'
  | '2'
  | '8'
  | '7'
  | '3'
  | '5'
  | '6'
  | 'E'
  | 'O'
  | 'D'
  | '4'
  | 'Q'
  | 'F'
  | 'U'
  | 'T'
  | '9'
  | 'AA';

export type KondisiCatat =
  | 'Normal'
  | 'TIDAK DIPAKAI'
  | 'RUMAH KOSONG'
  | 'STAND TEMPEL'
  | 'STAND-KONSUMEN'
  | 'REV.PENCATAT'
  | 'DK'
  | 'TIDAK ADA AIR'
  | 'MATI ADA AIR'
  | 'MTA'
  | 'TTB'
  | 'BMK/BMB'
  | 'TERHALANG'
  | 'METER RUSAK'
  | 'DICABUT'
  | 'MB'
  | 'ADA ANJING'
  | 'METER MUNDUR'
  | 'MUDA KEMBALI'
  | 'METER TERBALIK'
  | 'LOS METER'
  | 'Meter Dalam Air'
  | 'MANDIRI';

export type MetodeCatat = 'ONSITE' | 'OFFSITE';

export type SumberCatat =
  | 'PETUGAS_ONSITE'
  | 'PETUGAS_OFFSITE'
  | 'MANDIRI_WEB'
  | 'MANDIRI_APP';

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

export interface MasterKondisiCatat {
  kodeTmss: string;
  nama: string;
  kategori: 'TERBACA' | 'KENDALA_AKSES' | 'KERUSAKAN_FISIK' | 'PELANGGARAN';
  isKendalaAkses: boolean;
  triggerBacaMandiri: boolean;
  deskripsi?: string | null;
  aktif: boolean;
  createdAt: Date | string;
}

export interface CaterMandiriPelanggan {
  id: string;
  thbl: string;
  nolg: string;
  stma: number | string;
  pakaiM3?: number | string | null;
  fotoMeterUrl: string;
  fotoRumahUrl?: string | null;
  jarakDariRumahMeter?: number | string | null;
  isLokasiValid: boolean;
  channel: 'WEB_PORTAL' | 'MOBILE_APP';
  ipAddress?: string | null;
  userAgent?: string | null;
  statusVerifikasi: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  alasanPenolakan?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SubmitMandiriInput {
  thbl: string;
  nolg: string;
  stma: number;
  fotoMeterUrl: string;
  fotoRumahUrl?: string;
  longitude?: number;
  latitude?: number;
  channel?: 'WEB_PORTAL' | 'MOBILE_APP';
}

// --- Tarif Bertingkat & Biaya Tetap ---
export interface TarifBlok {
  id: string;
  tarifKode: string;
  blok: number;
  batasAwalM3: number;
  batasAkhirM3?: number | null;
  hargaPerM3: number | string;
  berlakuMulai: Date | string;
  berlakuSampai?: Date | string | null;
  catatan?: string | null;
  createdAt: Date | string;
}

export interface BiayaTetap {
  id: string;
  jenis: 'BEA_BEBAN' | 'BEA_ADMIN' | 'AIR_KOTOR' | string;
  ukuranMeter?: string | null;
  nominal: number | string;
  berlakuMulai: Date | string;
  berlakuSampai?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// --- Siklus Periode Penagihan & Closing ---
export type StatusPeriodePenagihan = 'BERJALAN' | 'TERKUNCI';

export interface PeriodePenagihan {
  periode: string; // '202601'
  status: StatusPeriodePenagihan;
  tanggalJatuhTempo?: Date | string | null;
  ditutupAt?: Date | string | null;
  ditutupById?: string | null;
  dibukaAt?: Date | string | null;
  dibukaById?: string | null;
  alasanBuka?: string | null;
  jumlahSl?: number | null;
  totalM3?: number | string | null;
  totalTagihan?: number | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// --- DPM (Daftar Pelanggan Menjadi) Target Catat Bulanan ---
export type StatusDaftarCatat = 'BELUM_DICATAT' | 'DICATAT' | 'TIDAK_TERCATAT' | 'DICABUT';
export type SumberDaftarCatat = 'CARRY_OVER' | 'PBPK' | 'MANUAL';

export interface DaftarCatat {
  id: string;
  periode: string;
  nolg: string;
  ruteKode?: string | null;
  petugasId?: string | null;
  urutan: number;
  sumber: SumberDaftarCatat;
  status: StatusDaftarCatat;
  selesaiAt?: Date | string | null;
  catatan?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
