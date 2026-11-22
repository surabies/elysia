import type {
  JenisPengaduan,
  PrioritasPengaduan,
  AppRole,
  KlasifikasiPengaduan,
  KebijakanConfig,
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
// Rujukan: Dokumen Draf Jawaban Kuesioner SOP Tirtawening v2.0 (Tabel II-1 & Permenkes 2/2023)
export const SLA_OVERRIDE_PER_JENIS: Partial<
  Record<JenisPengaduan, { responsJam: number; selesaiJam: number }>
> = {
  BOCOR_PIPA_DINAS: { responsJam: 2, selesaiJam: 24 },
  TIDAK_ADA_AIR: { responsJam: 1, selesaiJam: 24 },
  AIR_KERUH_BAU_BERWARNA: { responsJam: 2, selesaiJam: 48 },
};

// TODO-SOP: Apakah pengaduan tagihan rekening wajib diverifikasi (TERVERIFIKASI) sebelum dapat ditugaskan ke lapangan?
export const WAJIB_VERIFIKASI_TAGIHAN = true;

// TODO-SOP: Berapa jam batas waktu konfirmasi penyelesaian oleh pelanggan sebelum ditutup otomatis oleh sistem?
export const BATAS_KONFIRMASI_JAM = 72;

// TODO-SOP: Berapa kali maksimal tiket pengaduan diperbolehkan untuk dibuka kembali (reopen)?
export const MAKS_BUKA_KEMBALI = 2;

// TODO-SOP: Berapa panjang karakter minimal untuk alasan penolakan tiket pengaduan?
// Rujukan SOP v2.0 Butir I-8: kode alasan wajib + penjelasan minimal 30 karakter.
export const MIN_PANJANG_ALASAN_TOLAK = 30;

// TODO-SOP: Parameter radius (meter) dan jendela waktu (jam) untuk mendeteksi kemungkinan laporan kebocoran yang berulang/duplikat.
export const DUPLIKAT_RADIUS_METER = 100;
export const DUPLIKAT_JENDELA_JAM = 48;

/**
 * Daftar Kode Alasan Penolakan Baku (Kuesioner SOP v2.0 Butir I-7 & I-8)
 */
export const KODE_ALASAN_PENOLAKAN = [
  {
    kode: 'LUAR_TANGGUNG_JAWAB_PDAM',
    label: 'Di luar tanggung jawab PDAM (instalasi pipa persil setelah meter air)',
  },
  {
    kode: 'LUAR_WILAYAH_LAYANAN',
    label: 'Di luar wilayah layanan operasional Perumda Tirtawening',
  },
  {
    kode: 'TIDAK_DAPAT_DIVERIFIKASI',
    label: 'Tidak dapat diverifikasi (lokasi tidak ditemukan setelah 2x konfirmasi)',
  },
  {
    kode: 'LAPORAN_FIKTIF_BERTENTANGAN',
    label: 'Laporan fiktif atau bertentangan dengan ketentuan resmi',
  },
] as const;

/**
 * Daftar Kode Alasan Penangguhan / Jeda SLA yang Sah (Kuesioner SOP v2.0 Butir II-3 & II-4)
 * Maksimal durasi per periode jeda: 7 hari kalender (168 jam).
 */
export const KODE_JEDA_SAH_SLA = [
  {
    kode: 'MENUNGGU_IZIN_GALIAN',
    label: 'Menunggu izin galian instansi berwenang (Bina Marga / Dishub / Polisi)',
  },
  {
    kode: 'AKSES_PERSIL_TERTUTUP',
    label: 'Akses persil tertutup / terkunci (upaya kontak pemilik rumah nihil)',
  },
  {
    kode: 'CUACA_EKSTREM_BANJIR',
    label: 'Kondisi cuaca ekstrem / banjir membahayakan keselamatan kerja',
  },
  {
    kode: 'MENUNGGU_INFO_PELANGGAN',
    label: 'Menunggu kelengkapan informasi/patokan alamat dari pelapor',
  },
] as const;

/**
 * Konfigurasi Default Kebijakan SOP (Versi 1 Basis)
 */
export const DEFAULT_KEBIJAKAN_CONFIG: KebijakanConfig = {
  slaPrioritas: {
    DARURAT: { responsJam: 1, selesaiJam: 6 },
    TINGGI: { responsJam: 2, selesaiJam: 24 },
    NORMAL: { responsJam: 6, selesaiJam: 48 },
    RENDAH: { responsJam: 12, selesaiJam: 72 },
  },
  slaOverridePerJenis: SLA_OVERRIDE_PER_JENIS,
  klasifikasiPerJenis: KLASIFIKASI_PER_JENIS,
  prioritasDefaultPerJenis: PRIORITAS_DEFAULT_PER_JENIS,
  jenisPengaduanPetaPublik: JENIS_PENGADUAN_PETA_PUBLIK,
  wajibVerifikasiTagihan: WAJIB_VERIFIKASI_TAGIHAN,
  batasKonfirmasiJam: BATAS_KONFIRMASI_JAM,
  maksBukaKembali: MAKS_BUKA_KEMBALI,
  minPanjangAlasanTolak: MIN_PANJANG_ALASAN_TOLAK,
  duplikatRadiusMeter: DUPLIKAT_RADIUS_METER,
  duplikatJendelaJam: DUPLIKAT_JENDELA_JAM,
};

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
    'DIREKSI',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
    'STAFF_ADMIN_BILLING',
    'STAFF',
    'PELAKSANA',
  ],
  BUAT: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
    'STAFF_ADMIN_BILLING',
    'STAFF',
    'PELAKSANA',
  ],
  VERIFIKASI: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
    'STAFF_ADMIN_BILLING',
    'STAFF',
  ],
  TUGASKAN: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
  ],
  UPDATE_STATUS_LAPANGAN: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
    'PELAKSANA',
  ],
  TUTUP: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
  ],
  BUKA_KEMBALI: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
  ],
  ESKALASI: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
    'PELAKSANA',
  ],
  CATATAN_CHAT: [
    'SUPERADMIN',
    'VERIFIKATOR_1',
    'SUPERVISOR',
    'VERIFIKATOR_2',
    'MANAGER',
    'VERIFIKATOR_3',
    'SENIOR_MANAGER',
    'STAFF_ADMIN_BILLING',
    'STAFF',
    'PELAKSANA',
  ],
};
