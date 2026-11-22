import type {
  JenisPengaduan,
  PrioritasPengaduan,
  AppRole,
  KlasifikasiPengaduan,
} from '@cater/types';

/**
 * Konfigurasi SOP Modul Pengaduan Tirtawening (SSOT Asumsi SOP)
 * Seluruh nilai yang belum dibakukan secara tertulis oleh divisi terkait
 * ditandai dengan penanda // TODO-SOP: untuk bahan wawancara.
 */

// TODO-SOP: Jenis pengaduan apa saja yang bersifat gangguan area dan boleh ditampilkan pada peta spasial publik?
// Default asumsi: Gangguan pipa dinas, tidak ada air, serta air keruh/bau/berwarna.
export const JENIS_PENGADUAN_PETA_PUBLIK: readonly JenisPengaduan[] = [
  'BOCOR_PIPA_DINAS',
  'TIDAK_ADA_AIR',
  'AIR_KERUH_BAU_BERWARNA',
];

// TODO-SOP: Pemetaan jenis pengaduan ke klasifikasi tagihan (NILAI_TAGIHAN_REKENING) vs non-tagihan (BUKAN_NILAI_TAGIHAN_REKENING).
export const KLASIFIKASI_PER_JENIS: Record<JenisPengaduan, KlasifikasiPengaduan> = {
  LAPOR_STAND_METER: 'NILAI_TAGIHAN_REKENING',
  PENCATATAN_METER_TIDAK_SESUAI: 'NILAI_TAGIHAN_REKENING',
  LONJAKAN_PEMAKAIAN_AIR: 'NILAI_TAGIHAN_REKENING',
  BOCOR_PIPA_DINAS: 'BUKAN_NILAI_TAGIHAN_REKENING',
  TIDAK_ADA_AIR: 'BUKAN_NILAI_TAGIHAN_REKENING',
  AIR_KERUH_BAU_BERWARNA: 'BUKAN_NILAI_TAGIHAN_REKENING',
  GANTI_STOP_KRAN: 'BUKAN_NILAI_TAGIHAN_REKENING',
  PASANGAN_LIAR: 'BUKAN_NILAI_TAGIHAN_REKENING',
  MUTASI_GOLONGAN_TARIF: 'BUKAN_NILAI_TAGIHAN_REKENING',
  TIDAK_MAMPU_BAYAR: 'BUKAN_NILAI_TAGIHAN_REKENING',
  PINDAH_JARINGAN: 'BUKAN_NILAI_TAGIHAN_REKENING',
  LAINNYA: 'BUKAN_NILAI_TAGIHAN_REKENING',
};

// TODO-SOP: Prioritas default per jenis pengaduan bila tidak ditentukan secara manual oleh pelapor/petugas.
export const PRIORITAS_DEFAULT_PER_JENIS: Record<JenisPengaduan, PrioritasPengaduan> = {
  BOCOR_PIPA_DINAS: 'TINGGI',
  TIDAK_ADA_AIR: 'TINGGI',
  AIR_KERUH_BAU_BERWARNA: 'TINGGI',
  LONJAKAN_PEMAKAIAN_AIR: 'NORMAL',
  LAPOR_STAND_METER: 'NORMAL',
  PENCATATAN_METER_TIDAK_SESUAI: 'NORMAL',
  GANTI_STOP_KRAN: 'NORMAL',
  PASANGAN_LIAR: 'NORMAL',
  MUTASI_GOLONGAN_TARIF: 'NORMAL',
  TIDAK_MAMPU_BAYAR: 'NORMAL',
  PINDAH_JARINGAN: 'NORMAL',
  LAINNYA: 'NORMAL',
};

// TODO-SOP: Override SLA khusus per jenis pengaduan (jika kosong, menggunakan durasi default berdasarkan prioritas).
export const SLA_OVERRIDE_PER_JENIS: Partial<
  Record<JenisPengaduan, { responsJam: number; selesaiJam: number }>
> = {};

// TODO-SOP: Apakah pengaduan tagihan rekening wajib diverifikasi (TERVERIFIKASI) sebelum dapat ditugaskan ke lapangan?
export const WAJIB_VERIFIKASI_TAGIHAN = true;

// TODO-SOP: Berapa jam batas waktu konfirmasi penyelesaian oleh pelanggan sebelum ditutup otomatis oleh sistem?
export const BATAS_KONFIRMASI_JAM = 72;

// TODO-SOP: Berapa kali maksimal tiket pengaduan diperbolehkan untuk dibuka kembali (reopen)?
export const MAKS_BUKA_KEMBALI = 2;

// TODO-SOP: Berapa panjang karakter minimal untuk alasan penolakan tiket pengaduan?
export const MIN_PANJANG_ALASAN_TOLAK = 10;

// TODO-SOP: Parameter radius (meter) dan jendela waktu (jam) untuk mendeteksi kemungkinan laporan kebocoran yang berulang/duplikat.
export const DUPLIKAT_RADIUS_METER = 100;
export const DUPLIKAT_JENDELA_JAM = 48;

/**
 * Matriks Hak Akses / Otorisasi Aksi Pengaduan
 */
export type AksiPengaduanRole =
  | 'BACA'
  | 'BUAT'
  | 'VERIFIKASI'
  | 'TUGASKAN'
  | 'UPDATE_STATUS_LAPANGAN'
  | 'TUTUP'
  | 'BUKA_KEMBALI'
  | 'ESKALASI'
  | 'CATATAN_CHAT';

// TODO-SOP: Matriks wewenang per role internal PDAM Tirtawening
export const MATRIKS_IZIN_PENGADUAN: Record<AksiPengaduanRole, readonly AppRole[]> = {
  BACA: [
    'SUPERADMIN',
    'EXECUTIVE',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
    'STAFF_ADMIN_BILLING',
    'PELAKSANA',
  ],
  BUAT: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
    'STAFF_ADMIN_BILLING',
    'PELAKSANA',
  ],
  VERIFIKASI: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
    'STAFF_ADMIN_BILLING',
  ],
  TUGASKAN: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
  ],
  UPDATE_STATUS_LAPANGAN: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
    'PELAKSANA',
  ],
  TUTUP: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
  ],
  BUKA_KEMBALI: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
  ],
  ESKALASI: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
    'PELAKSANA',
  ],
  CATATAN_CHAT: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'VERIFIKATOR_2',
    'VERIFIKATOR_3',
    'STAFF_ADMIN_BILLING',
    'PELAKSANA',
  ],
};
