// features/dashboard/pengaturan/types.ts
// Kontrak tipe untuk modul Pengaturan Sistem & Preferensi Enterprise

export type WilayahPelayananId =
  | 'WILAYAH_1'
  | 'WILAYAH_2'
  | 'WILAYAH_3'
  | 'WILAYAH_4'
  | 'WILAYAH_5'
  | 'WILAYAH_6'
  | 'KANTOR_PUSAT';

export interface WilayahOption {
  value: WilayahPelayananId;
  label: string;
  description: string;
}

export const DAFTAR_WILAYAH_PELAYANAN: WilayahOption[] = [
  { value: 'WILAYAH_1', label: 'Pelayanan Wilayah 1', description: 'Cibeunying, Bandung Wetan, Sumur Bandung' },
  { value: 'WILAYAH_2', label: 'Pelayanan Wilayah 2', description: 'Rancasari, Buahbatu, Gedebage' },
  { value: 'WILAYAH_3', label: 'Pelayanan Wilayah 3', description: 'Arcamanik, Antapani, Ujungberung' },
  { value: 'WILAYAH_4', label: 'Pelayanan Wilayah 4', description: 'Coblong, Cidadap, Sukasari' },
  { value: 'WILAYAH_5', label: 'Pelayanan Wilayah 5', description: 'Andir, Sukajadi, Cicendo' },
  { value: 'WILAYAH_6', label: 'Pelayanan Wilayah 6', description: 'Regol, Lengkong, Bandung Kidul' },
  { value: 'KANTOR_PUSAT', label: 'Kantor Pusat (Seluruh Wilayah)', description: 'Otoritas Seluruh Wilayah Kota Bandung' },
];

export interface ProfilPenggunaConfig {
  fotoProfil: string | null;
  namaPetugas: string;
  nppPetugas: string;
  emailPetugas: string;
  rolePengguna: string;
  jabatanDinas: string;
  wilayahDinas: WilayahPelayananId;
}

export interface CaterConfig {
  radiusGeofence: string;
  minDurasiPerSL: string;
  wajibFotoMeter: boolean;
  blokirMockGps: boolean;
  autoFlashKamera: boolean;
}

export interface VerifikasiConfig {
  metodeTaksasiDefault: string;
  cutOffClosingDate: string;
  cutOffClosingHour: string;
  wajibCatatanKoreksi: boolean;
  ambangDeviasiRing1: string;
  ambangDeviasiRing2: string;
  ambangDeviasiRing3: string;
}

export interface BillingDrdConfig {
  beaAdminDefault: string;
  beaPemeliharaanRT: string;
  beaPemeliharaanNiaga: string;
  beaPemeliharaanIndustri: string;
  tanggalJatuhTempo: string;
  skemaDenda: string;
  nominalDendaFlat: string;
}

export interface PengaduanGwmConfig {
  slaBocorPipaJam: string;
  slaMeterMacetJam: string;
  slaSengketaStandJam: string;
  autoSpkGwmMacet: boolean;
  waGatewayAktif: boolean;
}

export interface SistemAuditConfig {
  kepadatanTabel: 'compact' | 'comfortable';
  suaraAlertAnomali: boolean;
  levelAuditTrail: string;
}
