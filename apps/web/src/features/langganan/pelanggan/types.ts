/**
 * Kontrak Tipe Data Fitur Pelanggan (Validasi Kontak, Pindah Tarif, Mutasi)
 */

export type KontakStatusFilter = 'ALL' | 'VALID' | 'EMPTY' | 'INVALID';

export type KontakStatusType = 'VALID' | 'EMPTY' | 'INVALID';

export interface PelangganKontakItem {
  nolg: string;
  nprs: string | null;
  nama: string;
  alamat: string;
  rt: string | null;
  rw: string | null;
  status: string;
  tarifKode: string | null;
  ruteKode: string | null;
  noMeter: string | null;
  noTelp: string | null;
  statusKontak: KontakStatusType;
  waLink: string | null;
}

export interface KontakKpiStats {
  total: number;
  valid: number;
  empty: number;
  invalid: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
}

export interface DaftarKontakResponse {
  success: boolean;
  kpi: KontakKpiStats;
  pagination: PaginationMeta;
  items: PelangganKontakItem[];
  error?: string;
}

export interface UpdateKontakPayload {
  noTelp: string;
}

export interface UpdateKontakResult {
  success: boolean;
  nolg: string;
  noTelp: string | null;
  message: string;
  error?: string;
}

export interface PelangganDetail {
  nolg: string;
  nprs?: string | null;
  nama: string;
  alamat: string;
  rt?: string | null;
  rw?: string | null;
  noTelp?: string | null;
  isMbr?: boolean;
  status: string;
  tarifKode?: string | null;
  tarifNama?: string | null;
  ruteKode?: string | null;
  noUrutRute?: number | null;
  noMeter?: string | null;
  titikLokasi?: { x: number; y: number } | null;
  catatanVerifikasi?: string | null;
}

export interface DetailPelangganResponse {
  success: boolean;
  data?: {
    pelanggan: PelangganDetail;
    riwayatBaca: Array<{
      id: string;
      thbl: string;
      stml: string | number | null;
      stma: string | number | null;
      pakaiM3: string | number | null;
      ketCatat?: string | null;
      tglCatat?: string | null;
      statusVerifikasi?: string | null;
    }>;
    riwayatDrd: Array<{
      id: string;
      thbl: string;
      pakaiM3: string | number | null;
      totalTagihan: string | number | null;
      statusLunas?: boolean;
    }>;
  };
  error?: string;
}

export interface GolonganTarifItem {
  kode: string;
  nama: string;
  beaBeban?: number;
  beaAdmin?: number;
  airKotor?: number;
  lainLain?: number;
  blok?: Array<{
    blok: number;
    batasAwalM3: number;
    batasAkhirM3: number | null;
    hargaPerM3: number;
  }>;
}

export interface SimulasiTagihanData {
  kode: string;
  nama: string;
  volumeM3: number;
  hargaAir: number;
  rincianBlok: Array<{
    blok: number;
    pemakaianM3: number;
    hargaPerM3: number;
    subtotal: number;
  }>;
  beaBeban: number;
  beaAdmin: number;
  airKotor: number;
  lainLain: number;
  totalTagihan: number;
}

export interface UpdateTarifPayload {
  tarifKode: string;
  alasan?: string;
  noSuratPermohonan?: string;
  nikPemohon?: string;
  namaPemohon?: string;
  noHpPemohon?: string;
  tahapPindahTarif?: string;
  petugasSurvei?: string;
  tglSurvei?: string;
  kesimpulanSurvei?: string;
  fotoSurveiUrl?: string;
  catatan?: string;
}

export interface UpdateTarifResult {
  success: boolean;
  nolg: string;
  tarifKodeLama?: string;
  tarifKodeBaru: string;
  message: string;
  error?: string;
}

export interface MutasiPelangganPayload {
  nama?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  status?: string;
  lat?: number;
  lng?: number;
  catatan?: string;
  // Mutasi Wilayah / Rute Lain
  ruteKodeBaru?: string;
  noUrutRuteBaru?: number;
  alasanMutasiWilayah?: string;
  noSuratMutasiWilayah?: string;
  // Syarat Berkas & Balik Nama
  nikKtp?: string;
  noHp?: string;
  jenisDokumen?: string;
  noDokumen?: string;
  lampiranUrl?: string;
  // Alur Pemutusan 3-Pihak
  tipePemutusan?: string;
  alasanPemutusan?: string;
  tahapPemutusan?: 'ORDER_LANGGANAN' | 'EKSEKUSI_ZONA' | 'PENGESAHAN_MANAGER' | string;
  standAngkat?: number;
  noSegel?: string;
  petugasEksekusi?: string;
  tglEksekusi?: string;
  fotoBuktiUrl?: string;
}

export interface MutasiPelangganResult {
  success: boolean;
  nolg: string;
  message: string;
  error?: string;
}

export interface PelangganGpsItem {
  nolg: string;
  nprs: string | null;
  nama: string;
  alamat: string;
  rt: string | null;
  rw: string | null;
  status: string;
  tarifKode: string | null;
  ruteKode: string | null;
  noUrutRute: number | null;
  noMeter: string | null;
  noTelp: string | null;
  hasGps: boolean;
  lat: number | null;
  lng: number | null;
}

export interface GpsKpiStats {
  total: number;
  berGps: number;
  tanpaGps: number;
  persen: number;
}

export interface DaftarGpsResponse {
  success: boolean;
  kpi: GpsKpiStats;
  pagination: PaginationMeta;
  items: PelangganGpsItem[];
  error?: string;
}

export interface UpdateGpsResult {
  success: boolean;
  nolg: string;
  lat: number;
  lng: number;
  message: string;
  error?: string;
}
