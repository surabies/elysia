// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/types.ts
// Definisi Tipe Modular Pengaturan Aturan Anomali & SSOT

export interface RuleItem {
  id: string;
  kode: string;
  nama: string;
  tipeAturan: string;
  arah: string;
  acuanPembanding: string;
  minM3: number | string | null;
  maxM3: number | string | null;
  minPersen: number | string | null;
  maxPersen: number | string | null;
  selisihMinM3: number | string | null;
  dihitungSebagaiAnomali: boolean;
  ringTingkat: number;
  tingkatKeparahan: string;
  badgeTone: string;
  urutan: number;
  aktif: boolean;
  syaratKondisiLalu?: string;
  syaratPakaiLaluMinM3?: number | string | null;
  syaratPakaiLaluDibawah?: number | string | null;
  syaratPeriodeBerturut?: number | string | null;
  kecualikanJikaBerlanjut?: boolean;
  kecualikanJikaPakaiLaluDibawah?: number | string | null;
  deskripsi?: string;
}

export interface KondisiMapItem {
  id: string;
  kodeTmss: string;
  aturanAnomaliId: string;
  aturanKode?: string;
  aturanNama?: string;
  keteranganKondisi?: string;
  kategori?: string;
  isBaselineNormal: boolean;
  isPeriodeTidakAktif: boolean;
  aktif: boolean;
  keterangan?: string;
}

export interface UnmappedItem {
  kodeTmss: string;
  keterangan: string;
  kategori: string;
  jumlahMuncul: number;
}

export interface VersionItem {
  id?: string;
  versi: number;
  alasan?: string;
  alasanPerubahan?: string;
  diterbitkanOleh?: string;
  diubahOleh?: string;
  createdAt?: string;
}

export interface AuditLogItem {
  id: string;
  aturanId?: string;
  aturanKode?: string;
  aksi: string;
  alasan: string;
  diubahOleh?: string;
  operatorNama?: string;
  waktu?: string;
  createdAt?: string;
  barisTerdampak?: number;
  versiSebelum?: number;
  versiSesudah?: number;
  nilaiLama?: any;
  nilaiBaru?: any;
}

export interface EditFormData {
  aktif: boolean;
  minM3: string;
  maxM3: string;
  minPersen: string;
  maxPersen: string;
  selisihMinM3: string;
  syaratPakaiLaluDibawah: string;
  syaratPeriodeBerturut: string;
  acuanPembanding: string;
  arahDeviasi: string;
}

export interface PreviewData {
  periode?: string;
  totalBaris?: number;
  jumlahBarisBerubah?: number;
  totalBarisBerubah?: number;
  sebelum: { anomali: number; warning?: number; normal: number; peringatan?: number };
  sesudah: { anomali: number; warning?: number; normal: number; peringatan?: number };
  perubahanNetto?: { anomali: number; warning?: number; normal: number };
}
