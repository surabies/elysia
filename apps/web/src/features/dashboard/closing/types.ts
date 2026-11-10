export type WorkflowStageCategory =
  | 'PRA_CLOSING'
  | 'EKSEKUSI'
  | 'PASCA_CLOSING'
  | 'MONITORING';

export type WorkflowStageStatus =
  | 'SELESAI'
  | 'SIAP'
  | 'PERLU_TINDAKAN'
  | 'TERKUNCI'
  | 'MENUNGGU';

export interface WorkflowStageItem {
  stageNumber: number;
  id: string;
  nama: string;
  kategori: WorkflowStageCategory;
  status: WorkflowStageStatus;
  deskripsi: string;
  metrikUtama: string;
  canExecute?: boolean;
  routeUrl: string;
  detail?: Record<string, unknown>;
}

export interface PratinjauHambatan {
  kode: string;
  pesan: string;
  jumlah: number;
  contoh: string[];
}

export interface ClosingAuditInfo {
  ditutupAt: string | null;
  ditutupById: string | null;
  tanggalJatuhTempo: string | null;
}

export interface PratinjauData {
  periode: string;
  status: 'BERJALAN' | 'TERKUNCI' | 'BELUM_ADA';
  daftarCatat: {
    total: number;
    selesai: number;
    belumSelesai: number;
    readRatePersen: number;
  };
  verifikasi: {
    total: number;
    selesaiV3: number;
    belumSelesai: number;
  };
  pembacaan: {
    total: number;
    sudahDitagih: number;
    akanDitagih: number;
  };
  perkiraan: {
    jumlahSl: number;
    totalM3: number;
    totalTagihan: number;
  };
  hambatan: PratinjauHambatan[];
  bisaDitutup: boolean;
  audit?: ClosingAuditInfo;
}

export type ClosingWizardStep = 1 | 2 | 3 | 4 | 5;

export interface ClosingStepEvaluation {
  step: ClosingWizardStep;
  title: string;
  subtitle: string;
  operatorTask: string;
  isCompleted: boolean;
  canProceed: boolean;
  blockerReasons: string[];
}

export interface OperatorFeedback {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dataImpact?: string;
  nextAction?: string;
}

export type StandAngkatVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StandAngkatMutasiItem {
  id: string;
  nolg: string;
  namaPelanggan: string | null;
  periode: number;
  tglGanti: string;
  alasan: string;
  keterangan: string | null;
  noMeterLama: string;
  standAngkat: number;
  noMeterBaru: string;
  standPasang: number;
  petugasPasang: string;
  statusVerifikasi: StandAngkatVerificationStatus;
}

export interface MonitoringTutupBulanProps {
  highlightStage?: string;
  initialTab?: string;
  initialStep?: ClosingWizardStep;
}

export type ClosingConsoleTab =
  | 'pipeline'
  | 'stand-angkat'
  | 'perbandingan'
  | 'panduan';

// ============================================================================
// Tahap 6: Perbandingan Periode (N vs N-1) Types
// ============================================================================

export interface PerbandinganTarifItem {
  tarifKode: string;
  tarifNama: string;
  slPeriodeLalu: number;
  slPeriodeKini: number;
  deltaSl: number;
  m3PeriodeLalu: number;
  m3PeriodeKini: number;
  deltaM3Persen: number;
  rpPeriodeLalu: number;
  rpPeriodeKini: number;
  deltaRpPersen: number;
}

export interface PerbandinganPeriodeData {
  periodeKini: string;
  periodeLalu: string;
  ringkasan: {
    totalSlKini: number;
    totalSlLalu: number;
    deltaSl: number;
    totalM3Kini: number;
    totalM3Lalu: number;
    deltaM3Persen: number;
    totalRpKini: number;
    totalRpLalu: number;
    deltaRpPersen: number;
  };
  breakdownTarif: PerbandinganTarifItem[];
}

// ============================================================================
// PBPK (Pasang Baru & Perubahan Kategori) Types
// ============================================================================

export interface PasangBaruItem {
  nolg: string;
  nama: string;
  alamat: string;
  tarifKode: string | null;
  ruteKode: string | null;
  noMeter: string | null;
  noTelp: string | null;
  createdAt: string;
}

export interface MasterOptionItem {
  kode: string;
  nama: string;
}

export interface PbpkData {
  periode: string;
  ringkasan: {
    totalMasterPelanggan: number;
    totalPasangBaru: number;
    totalPerubahanKategori: number;
    statusIntegrasiDpm: string;
  };
  daftarPasangBaru: PasangBaruItem[];
  masterTarif: MasterOptionItem[];
  masterRute: MasterOptionItem[];
}

export interface CreatePasangBaruPayload {
  nolg: string;
  nama: string;
  alamat: string;
  tarifKode: string;
  ruteKode: string;
  noMeter: string;
  noTelp?: string;
}

export interface CreatePerubahanKategoriPayload {
  nolg: string;
  tarifKodeBaru: string;
  nomorSk?: string;
  alasan?: string;
}

// ============================================================================
// Cek Selisih Pelanggan (4-Pilar Reconciliation) Types
// ============================================================================

export type RekonsiliasiRuteStatus = 'SEIMBANG' | 'SELISIH';

export interface CekSelisihRuteItem {
  ruteKode: string;
  namaRute: string;
  totalPelanggan: number;
  terbaca: number;
  terbitDrd: number;
  selisih: number;
  status: RekonsiliasiRuteStatus;
}

export interface UnbilledPelangganItem {
  nolg: string;
  nama: string;
  ruteKode: string;
  stml: number;
  stma: number;
  pakaiM3: number;
  statusVerifikasi: string;
}

export interface CekSelisihData {
  periode: string;
  ringkasan: {
    totalMasterPelanggan: number;
    totalDpmTarget: number;
    totalTerbaca: number;
    totalTerbitDrd: number;
    totalSelisihUnbilled: number;
    statusRekonsiliasi: 'MATCH' | 'DISCREPANCY';
  };
  ruteBreakdown: CekSelisihRuteItem[];
  daftarUnbilled: UnbilledPelangganItem[];
}
