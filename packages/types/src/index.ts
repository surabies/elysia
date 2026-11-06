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

export type StatusVerifikasi =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ANOMALY_HIGH'
  | 'ANOMALY_LOW'
  | 'REVISED';

export type StatusPelanggan = 'AKTIF' | 'SEGEL' | 'PUTUS' | 'TIDAK_AKTIF';

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
