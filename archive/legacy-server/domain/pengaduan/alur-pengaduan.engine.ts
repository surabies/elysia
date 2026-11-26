/**
 * Domain Engine: Alur Pengaduan Air & State Machine Tiket
 * Lapisan: 1. Domain Engine (Pure Business Logic - Zero DB & Zero HTTP dependencies)
 */

import { randomInt } from 'node:crypto';
import type {
  StatusPengaduan,
  PrioritasPengaduan,
  JenisPengaduan,
  KlasifikasiPengaduan,
  AksiPengaduan,
  AppRole,
  KebijakanConfig,
} from '@cater/types';
import {
  KLASIFIKASI_PER_JENIS,
  PRIORITAS_DEFAULT_PER_JENIS,
  SLA_OVERRIDE_PER_JENIS,
  WAJIB_VERIFIKASI_TAGIHAN,
  BATAS_KONFIRMASI_JAM,
  MAKS_BUKA_KEMBALI,
  MIN_PANJANG_ALASAN_TOLAK,
  MATRIKS_IZIN_PENGADUAN,
  DEFAULT_KEBIJAKAN_CONFIG,
  type AksiPengaduanRole,
} from './pengaduan.config';

/**
 * Pemetaan 2 Huruf Semantik Kode Jenis Pengaduan:
 * Contoh: Bocor Pipa -> BP, Lonjakan Air -> LA, Lapor Meter -> LM, dll.
 */
export const KODE_JENIS_PENGADUAN: Record<JenisPengaduan, string> = {
  BOCOR_PIPA_DINAS: 'BP',
  LONJAKAN_PEMAKAIAN_AIR: 'LA',
  LAPOR_STAND_METER: 'LM',
  PENCATATAN_METER_TIDAK_SESUAI: 'PM',
  TIDAK_ADA_AIR: 'TA',
  AIR_KERUH_BAU_BERWARNA: 'AK',
  GANTI_STOP_KRAN: 'GS',
  PASANGAN_LIAR: 'PL',
  MUTASI_GOLONGAN_TARIF: 'MG',
  TIDAK_MAMPU_BAYAR: 'TB',
  PINDAH_JARINGAN: 'PJ',
  LAINNYA: 'TK',
};

export const LABEL_JENIS_PENGADUAN: Record<JenisPengaduan, string> = {
  BOCOR_PIPA_DINAS: 'Bocor Pipa Dinas',
  LONJAKAN_PEMAKAIAN_AIR: 'Lonjakan Pemakaian Air',
  LAPOR_STAND_METER: 'Lapor Stand Meter',
  PENCATATAN_METER_TIDAK_SESUAI: 'Pencatatan Meter Tidak Sesuai',
  TIDAK_ADA_AIR: 'Tidak Ada Air',
  AIR_KERUH_BAU_BERWARNA: 'Air Keruh, Bau & Berwarna',
  GANTI_STOP_KRAN: 'Ganti Stop Kran',
  PASANGAN_LIAR: 'Pasangan Liar',
  MUTASI_GOLONGAN_TARIF: 'Mutasi Golongan Tarif',
  TIDAK_MAMPU_BAYAR: 'Tidak Mampu Bayar',
  PINDAH_JARINGAN: 'Pindah Jaringan',
  LAINNYA: 'Lainnya',
};

/**
 * Format Standar Nomor Tiket Terukur PDAM Tanpa Simbol/Tanda Hubung:
 * [KODE (2)][WILAYAH (2)][TANGGAL (6: YYMMDD)][URUT (4: 0001-9999)]
 * Contoh: TK052611060001 (Total: Tepat 14 Karakter)
 */
export const POLA_NOMOR_TIKET = /^[A-Z]{2}[0-9]{2}[0-9]{6}[0-9]{4}$/;

export interface GenerateNomorTiketOptions {
  kode?: string;
  jenis?: JenisPengaduan;
  wilayah?: string; // 2 digit angka, e.g. '05' atau '00'
  tanggal?: Date;
  urut?: number; // nomor urut 1 - 9999
}

/**
 * Pembangkit Nomor Tiket Terukur & Bersih Tanpa Simbol
 * Format: [KODE][WILAYAH][TANGGAL][URUT]
 * Menggunakan Waktu Indonesia Barat (WIB, UTC+7)
 */
export function generateNomorTiket(options?: GenerateNomorTiketOptions | Date): string {
  let opts: GenerateNomorTiketOptions = {};
  if (options instanceof Date) {
    opts = { tanggal: options };
  } else if (options) {
    opts = options;
  }

  // 1. [KODE] 2 Karakter Huruf
  let kode = opts.kode ?? (opts.jenis ? KODE_JENIS_PENGADUAN[opts.jenis] : 'TK');
  kode = kode.toUpperCase().padEnd(2, 'K').slice(0, 2);

  // 2. [WILAYAH] 2 Digit Angka
  let wilayah = opts.wilayah ?? '00';
  wilayah = wilayah.replace(/\D/g, '').padStart(2, '0').slice(-2);

  // 3. [TANGGAL] 6 Digit Angka (YYMMDD dalam WIB UTC+7)
  const tgl = opts.tanggal ?? new Date();
  const wibTime = new Date(tgl.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(wibTime.getUTCFullYear()).slice(-2);
  const mm = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(wibTime.getUTCDate()).padStart(2, '0');
  const tanggalStr = `${yy}${mm}${dd}`;

  // 4. [URUT] 4 Digit Angka (0001 - 9999)
  let urutStr: string;
  if (typeof opts.urut === 'number' && opts.urut > 0) {
    urutStr = String(opts.urut).padStart(4, '0').slice(-4);
  } else {
    // Fallback acak 4 digit jika nomor urut belum dihitung dari database
    urutStr = String(randomInt(1, 10000)).padStart(4, '0');
  }

  return `${kode}${wilayah}${tanggalStr}${urutStr}`;
}

/**
 * Membedah (Parse) Nomor Tiket menjadi Komponen-Komponen Terstrukturnya
 */
export function parseNomorTiket(nomorTiket: string): {
  valid: boolean;
  kode?: string;
  wilayah?: string;
  tanggalStr?: string;
  tahun?: number;
  bulan?: number;
  hari?: number;
  urut?: number;
} {
  const clean = nomorTiket.trim().toUpperCase();
  if (!POLA_NOMOR_TIKET.test(clean)) {
    return { valid: false };
  }

  const kode = clean.slice(0, 2);
  const wilayah = clean.slice(2, 4);
  const tanggalStr = clean.slice(4, 10);
  const urutStr = clean.slice(10, 14);

  const yy = parseInt(tanggalStr.slice(0, 2), 10);
  const mm = parseInt(tanggalStr.slice(2, 4), 10);
  const dd = parseInt(tanggalStr.slice(4, 6), 10);
  const urut = parseInt(urutStr, 10);

  return {
    valid: true,
    kode,
    wilayah,
    tanggalStr,
    tahun: 2000 + yy,
    bulan: mm,
    hari: dd,
    urut,
  };
}

/**
 * Menurunkan Klasifikasi Pengaduan (Tagihan vs Non-Tagihan) dari Jenis Pengaduan
 */
export function tentukanKlasifikasi(
  jenis: JenisPengaduan,
  kebijakan?: KebijakanConfig
): KlasifikasiPengaduan {
  const map = kebijakan?.klasifikasiPerJenis ?? KLASIFIKASI_PER_JENIS;
  return map[jenis] ?? 'BUKAN_NILAI_TAGIHAN_REKENING';
}

/**
 * Menentukan Prioritas Awal Tiket (Default Berdasarkan Jenis Pengaduan jika tidak diisi)
 */
export function tentukanPrioritasAwal(
  jenis: JenisPengaduan,
  prioritasInput?: PrioritasPengaduan,
  kebijakan?: KebijakanConfig
): PrioritasPengaduan {
  if (prioritasInput) return prioritasInput;
  const map = kebijakan?.prioritasDefaultPerJenis ?? PRIORITAS_DEFAULT_PER_JENIS;
  return map[jenis] ?? 'NORMAL';
}

/**
 * Daftar Transisi Status Pengaduan yang Sah (State Machine Whitelist)
 */
export const TRANSISI_PENGADUAN: Record<StatusPengaduan, readonly StatusPengaduan[]> = {
  BARU: ['TERVERIFIKASI', 'DITUGASKAN', 'DITOLAK'],
  TERVERIFIKASI: ['DITUGASKAN', 'MENUNGGU_PELANGGAN', 'DITOLAK'],
  DITUGASKAN: ['DITUGASKAN', 'MENUJU_LOKASI', 'DIPROSES', 'MENUNGGU_PELANGGAN', 'DITOLAK'],
  MENUJU_LOKASI: ['DIPROSES', 'MENUNGGU_PELANGGAN', 'DITUGASKAN'],
  DIPROSES: ['DITUGASKAN', 'MENUNGGU_PELANGGAN', 'SELESAI', 'DITOLAK'],
  MENUNGGU_PELANGGAN: ['DIPROSES', 'DITUGASKAN', 'SELESAI', 'DITOLAK'],
  SELESAI: ['DITUTUP', 'DIBUKA_KEMBALI'],
  DITOLAK: ['DIBUKA_KEMBALI'],
  DIBUKA_KEMBALI: ['DITUGASKAN', 'DIPROSES', 'DITOLAK'],
  DITUTUP: [],
};

/**
 * Memvalidasi apakah transisi dari suatu status ke status baru diperbolehkan
 * Mendukung opsi klasifikasi: pengaduan tagihan rekening wajib TERVERIFIKASI sebelum DITUGASKAN (K1)
 */
export function isTransisiSah(
  dari: StatusPengaduan,
  ke: StatusPengaduan,
  opsi?: { klasifikasi?: KlasifikasiPengaduan; kebijakan?: KebijakanConfig }
): boolean {
  const targetSah = TRANSISI_PENGADUAN[dari];
  if (!targetSah || !targetSah.includes(ke)) {
    return false;
  }

  // K1: Pengaduan NILAI_TAGIHAN_REKENING wajib lewat TERVERIFIKASI, tidak boleh langsung BARU -> DITUGASKAN
  const wajibVerif = opsi?.kebijakan?.wajibVerifikasiTagihan ?? WAJIB_VERIFIKASI_TAGIHAN;
  if (
    opsi?.klasifikasi === 'NILAI_TAGIHAN_REKENING' &&
    wajibVerif &&
    dari === 'BARU' &&
    ke === 'DITUGASKAN'
  ) {
    return false;
  }

  return true;
}

/**
 * Durasi SLA berdasarkan tingkat prioritas tiket
 */
export interface DurasiSla {
  responsJam: number;
  selesaiJam: number;
}

export const SLA_PRIORITAS: Record<PrioritasPengaduan, DurasiSla> = {
  DARURAT: { responsJam: 1, selesaiJam: 6 },
  TINGGI: { responsJam: 2, selesaiJam: 24 },
  NORMAL: { responsJam: 6, selesaiJam: 48 },
  RENDAH: { responsJam: 12, selesaiJam: 72 },
};

/**
 * Menghitung Target Waktu SLA Tiket
 * Mendukung override per jenis pengaduan dan konfigurasi kebijakan berversi
 */
export function hitungTargetSla(
  prioritas: PrioritasPengaduan,
  mulai: Date = new Date(),
  opsi?: { jenis?: JenisPengaduan; kebijakan?: KebijakanConfig }
): { targetResponsAt: Date; targetSelesaiAt: Date } {
  const kebijakan = opsi?.kebijakan ?? DEFAULT_KEBIJAKAN_CONFIG;
  const override = opsi?.jenis ? kebijakan.slaOverridePerJenis[opsi.jenis] : undefined;
  const sla = override ?? kebijakan.slaPrioritas[prioritas] ?? kebijakan.slaPrioritas.NORMAL;

  const targetResponsAt = new Date(mulai.getTime() + sla.responsJam * 60 * 60 * 1000);
  const targetSelesaiAt = new Date(mulai.getTime() + sla.selesaiJam * 60 * 60 * 1000);

  return { targetResponsAt, targetSelesaiAt };
}

/**
 * Evaluasi Kelayakan Pembuatan Tiket (Aturan Khusus Jenis Pengaduan)
 * Memvalidasi nama pelapor, GPS wajib untuk Bocor Pipa Dinas, serta rentang bujur/lintang
 */
export function evaluasiPembuatanTiket(input: {
  jenis: JenisPengaduan;
  koordinat?: { x: number; y: number } | null;
  pelapor: string;
}): { valid: boolean; pesanError?: string } {
  if (!input.pelapor || input.pelapor.trim().length === 0) {
    return { valid: false, pesanError: 'Nama pelapor wajib diisi.' };
  }

  if (input.jenis === 'BOCOR_PIPA_DINAS' && !input.koordinat) {
    return {
      valid: false,
      pesanError: 'Pengaduan Bocor Pipa Dinas wajib menyertakan koordinat titik lokasi kejadian.',
    };
  }

  if (input.koordinat) {
    const { x, y } = input.koordinat;
    if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) {
      return { valid: false, pesanError: 'Nilai koordinat harus berupa angka numerik yang valid.' };
    }
    if (x < -180 || x > 180 || y < -90 || y > 90) {
      return {
        valid: false,
        pesanError:
          'Koordinat GPS berada di luar rentang geografis yang valid (bujur -180..180, lintang -90..90).',
      };
    }
  }

  return { valid: true };
}

/**
 * Menghitung Efek Jeda SLA Tiket (K3)
 * Fungsi murni untuk menghitung durasi jeda, menambah jedaTotalMenit, dan menggeser targetSelesaiAt
 */
export interface EfekJeda {
  durasiMenit: number;
  jedaTotalMenitBaru: number;
  targetSelesaiAtBaru: Date;
  jedaMulaiAtBaru: null;
}

export function hitungEfekJeda(params: {
  jedaMulaiAt: Date | string;
  targetSelesaiAt: Date | string;
  jedaTotalMenitSebelumnya?: number;
  sekarang?: Date;
}): EfekJeda {
  const mulai = new Date(params.jedaMulaiAt);
  const target = new Date(params.targetSelesaiAt);
  const now = params.sekarang ?? new Date();

  const durasiMs = Math.max(0, now.getTime() - mulai.getTime());
  const durasiMenit = Math.round(durasiMs / 60000);
  const jedaTotalMenitBaru = (params.jedaTotalMenitSebelumnya ?? 0) + durasiMenit;
  const targetSelesaiAtBaru = new Date(target.getTime() + durasiMs);

  return {
    durasiMenit,
    jedaTotalMenitBaru,
    targetSelesaiAtBaru,
    jedaMulaiAtBaru: null,
  };
}

/**
 * Ringkasan Status SLA Pengaduan untuk Grid & Detail View (B9)
 */
export interface RingkasanSla {
  targetResponsAt: string | null;
  targetSelesaiAt: string | null;
  sisaMenit: number | null;
  melanggar: boolean;
  responsTerlambat: boolean;
  terjeda: boolean;
}

export function ringkasSla(
  p: {
    status: string;
    targetResponsAt?: Date | string | null;
    targetSelesaiAt?: Date | string | null;
    responsAt?: Date | string | null;
    selesaiAt?: Date | string | null;
    jedaMulaiAt?: Date | string | null;
  },
  sekarang: Date = new Date()
): RingkasanSla {
  const status = p.status;
  const tertutup = status === 'SELESAI' || status === 'DITUTUP' || status === 'DITOLAK';
  const targetSelesai = p.targetSelesaiAt ? new Date(p.targetSelesaiAt) : null;
  const targetRespons = p.targetResponsAt ? new Date(p.targetResponsAt) : null;
  const selesai = p.selesaiAt ? new Date(p.selesaiAt) : null;
  const respons = p.responsAt ? new Date(p.responsAt) : null;
  const terjeda = status === 'MENUNGGU_PELANGGAN' && Boolean(p.jedaMulaiAt);
  const acuan = terjeda && p.jedaMulaiAt ? new Date(p.jedaMulaiAt) : sekarang;

  // sisaMenit: dibekukan pada selesaiAt untuk tiket tertutup, atau pada jedaMulaiAt untuk tiket yang terjeda
  const sisaMenit = targetSelesai
    ? Math.round(
        (targetSelesai.getTime() -
          (tertutup && selesai ? selesai.getTime() : acuan.getTime())) /
          60000
      )
    : null;

  // B9: Tiket yang selesai setelah targetSelesaiAt tetap dihitung melanggar SLA
  let melanggar = false;
  if (tertutup) {
    if (selesai && targetSelesai) {
      melanggar = selesai.getTime() > targetSelesai.getTime();
    } else {
      melanggar = false; // DITOLAK tanpa penyelesaian tidak dihitung melanggar SLA
    }
  } else {
    melanggar = targetSelesai !== null && sisaMenit !== null && sisaMenit < 0;
  }

  // B9: responsTerlambat untuk tiket DITOLAK dari BARU harus false jika ditutup
  let responsTerlambat = false;
  if (respons && targetRespons) {
    responsTerlambat = respons.getTime() > targetRespons.getTime();
  } else if (!respons && !tertutup && targetRespons) {
    responsTerlambat = sekarang.getTime() > targetRespons.getTime();
  } else {
    responsTerlambat = false;
  }

  return {
    targetResponsAt: targetRespons ? targetRespons.toISOString() : null,
    targetSelesaiAt: targetSelesai ? targetSelesai.toISOString() : null,
    sisaMenit,
    melanggar,
    responsTerlambat,
    terjeda,
  };
}

/**
 * Parameter untuk Menghitung Side-Effect Perubahan Transisi Status (Fungsi Murni)
 */
export interface HitungPerubahanTransisiInput {
  statusDari: StatusPengaduan;
  statusKe: StatusPengaduan;
  prioritas: PrioritasPengaduan;
  jenis: JenisPengaduan;
  klasifikasi?: KlasifikasiPengaduan;
  responsAt?: Date | null;
  jedaMulaiAt?: Date | null;
  jedaTotalMenit?: number;
  targetSelesaiAt?: Date | null;
  konfirmasiBatasAt?: Date | null;
  jumlahDibukaKembali?: number;
  catatan?: string | null;
  fotoUrl?: string | null;
  sumberAksi?: 'STAF' | 'PELAPOR' | 'OTOMATIS';
  sekarang?: Date;
  kebijakan?: KebijakanConfig;
}

export interface HasilPerubahanTransisi {
  patch: {
    status: StatusPengaduan;
    responsAt?: Date;
    verifikasiAt?: Date;
    selesaiAt?: Date | null;
    konfirmasiBatasAt?: Date | null;
    jedaMulaiAt?: Date | null;
    jedaTotalMenit?: number;
    targetSelesaiAt?: Date;
    jumlahDibukaKembali?: number;
    updatedAt: Date;
  };
  aksiRiwayat: AksiPengaduan;
  pesanRiwayat: string;
}

/**
 * Menghitung Seluruh Patch Kolom & Aksi Riwayat Audit saat Terjadi Perubahan Status Tiket
 * Fungsi murni tanpa efek samping DB/jaringan.
 */
export function hitungPerubahanTransisi(
  input: HitungPerubahanTransisiInput
): HasilPerubahanTransisi {
  const kebijakan = input.kebijakan ?? DEFAULT_KEBIJAKAN_CONFIG;
  const { statusDari, statusKe, prioritas, jenis } = input;
  const klasifikasi = input.klasifikasi ?? tentukanKlasifikasi(jenis, kebijakan);
  const now = input.sekarang ?? new Date();

  // 1. Validasi sahnya transisi
  if (!isTransisiSah(statusDari, statusKe, { klasifikasi, kebijakan })) {
    throw new Error(
      `Transisi status tidak diizinkan: dari '${statusDari}' ke '${statusKe}'${
        klasifikasi === 'NILAI_TAGIHAN_REKENING' ? ' (Wajib Verifikasi Tagihan)' : ''
      }.`
    );
  }

  const patch: HasilPerubahanTransisi['patch'] = {
    status: statusKe,
    updatedAt: now,
  };

  let aksiRiwayat: AksiPengaduan = 'STATUS_DIUBAH';
  let pesanRiwayat = input.catatan?.trim() || `Status tiket diubah menjadi ${statusKe}.`;

  // 2. Transisi pertama keluar dari BARU mengisi responsAt
  if (statusDari === 'BARU' && statusKe !== 'BARU') {
    if (!input.responsAt) {
      patch.responsAt = now;
    }
  }

  // 3. Efek keluar dari MENUNGGU_PELANGGAN (Resume Jeda SLA)
  if (statusDari === 'MENUNGGU_PELANGGAN' && statusKe !== 'MENUNGGU_PELANGGAN') {
    if (input.jedaMulaiAt && input.targetSelesaiAt) {
      const efek = hitungEfekJeda({
        jedaMulaiAt: input.jedaMulaiAt,
        targetSelesaiAt: input.targetSelesaiAt,
        jedaTotalMenitSebelumnya: input.jedaTotalMenit,
        sekarang: now,
      });
      patch.jedaMulaiAt = efek.jedaMulaiAtBaru;
      patch.jedaTotalMenit = efek.jedaTotalMenitBaru;
      patch.targetSelesaiAt = efek.targetSelesaiAtBaru;
    }
  }

  // 4. Efek spesifik berdasarkan statusKe
  switch (statusKe) {
    case 'TERVERIFIKASI': {
      patch.verifikasiAt = now;
      aksiRiwayat = 'DIVERIFIKASI';
      pesanRiwayat = input.catatan?.trim() || 'Pengaduan telah diverifikasi oleh tim penanganan.';
      break;
    }

    case 'MENUNGGU_PELANGGAN': {
      patch.jedaMulaiAt = now;
      aksiRiwayat = 'STATUS_DIUBAH';
      pesanRiwayat =
        input.catatan?.trim() || 'Pengerjaan dijeda: menunggu konfirmasi/tanggapan dari pelanggan.';
      break;
    }

    case 'SELESAI': {
      // Wajib catatan atau foto bukti penyelesaian
      if (!input.fotoUrl && (!input.catatan || input.catatan.trim().length === 0)) {
        throw new Error(
          'Penyelesaian tiket wajib menyertakan foto bukti atau catatan hasil pekerjaan.'
        );
      }
      const batasJam = kebijakan.batasKonfirmasiJam ?? BATAS_KONFIRMASI_JAM;
      patch.selesaiAt = now;
      patch.konfirmasiBatasAt = new Date(now.getTime() + batasJam * 60 * 60 * 1000);
      aksiRiwayat = 'STATUS_DIUBAH';
      pesanRiwayat = input.catatan?.trim() || 'Pekerjaan perbaikan telah selesai dilaksanakan.';
      break;
    }

    case 'DITUTUP': {
      if (input.sumberAksi === 'PELAPOR') {
        aksiRiwayat = 'DIKONFIRMASI';
        pesanRiwayat = input.catatan?.trim() || 'Pelapor mengonfirmasi penutupan pengaduan.';
      } else if (input.sumberAksi === 'OTOMATIS') {
        aksiRiwayat = 'DITUTUP_OTOMATIS';
        pesanRiwayat = 'Tiket ditutup secara otomatis karena telah melewati batas waktu konfirmasi.';
      } else {
        aksiRiwayat = 'STATUS_DIUBAH';
        pesanRiwayat = input.catatan?.trim() || 'Tiket ditutup oleh petugas layanan.';
      }
      break;
    }

    case 'DIBUKA_KEMBALI': {
      // Alasan pembukaan kembali wajib
      if (!input.catatan || input.catatan.trim().length === 0) {
        throw new Error('Alasan pembukaan kembali pengaduan wajib diisi.');
      }

      // Validasi jendela konfirmasi bila dibuka kembali dari SELESAI
      if (statusDari === 'SELESAI' && input.konfirmasiBatasAt) {
        const batas = new Date(input.konfirmasiBatasAt);
        if (now.getTime() > batas.getTime()) {
          throw new Error('Batas waktu konfirmasi dan pembukaan kembali tiket telah kedaluwarsa.');
        }
      }

      // Validasi batas maksimal pembukaan kembali
      const jumlahSekarang = input.jumlahDibukaKembali ?? 0;
      const maksBuka = kebijakan.maksBukaKembali ?? MAKS_BUKA_KEMBALI;
      if (jumlahSekarang >= maksBuka) {
        throw new Error(
          `Pengaduan tidak dapat dibuka kembali karena telah mencapai batas maksimal (${maksBuka} kali).`
        );
      }

      patch.jumlahDibukaKembali = jumlahSekarang + 1;
      patch.selesaiAt = null;
      patch.konfirmasiBatasAt = null;
      patch.jedaMulaiAt = null;

      // Reset siklus SLA baru
      const targetBaru = hitungTargetSla(prioritas, now, { jenis, kebijakan });
      patch.targetSelesaiAt = targetBaru.targetSelesaiAt;

      aksiRiwayat = 'DIBUKA_KEMBALI';
      pesanRiwayat = input.catatan.trim();
      break;
    }

    case 'DITOLAK': {
      // K8: Penolakan tiket wajib menyertakan alasan minimal minPanjangAlasanTolak karakter
      const minPanjangTolak = kebijakan.minPanjangAlasanTolak ?? MIN_PANJANG_ALASAN_TOLAK;
      if (!input.catatan || input.catatan.trim().length < minPanjangTolak) {
        throw new Error(
          `Penolakan pengaduan wajib menyertakan alasan penolakan minimal ${minPanjangTolak} karakter.`
        );
      }
      aksiRiwayat = 'STATUS_DIUBAH';
      pesanRiwayat = input.catatan.trim();
      break;
    }

    default: {
      aksiRiwayat = 'STATUS_DIUBAH';
      pesanRiwayat = input.catatan?.trim() || `Status berhasil diubah ke ${statusKe}.`;
      break;
    }
  }

  return {
    patch,
    aksiRiwayat,
    pesanRiwayat,
  };
}

/**
 * Menentukan Kategori Aksi Otorisasi dari Status Tujuan (B6)
 */
export function tentukanAksiDariStatus(statusKe: StatusPengaduan): AksiPengaduanRole {
  if (statusKe === 'TERVERIFIKASI' || statusKe === 'DITOLAK') {
    return 'VERIFIKASI';
  }
  if (statusKe === 'DITUGASKAN') {
    return 'TUGASKAN';
  }
  if (statusKe === 'DITUTUP') {
    return 'TUTUP';
  }
  if (statusKe === 'DIBUKA_KEMBALI') {
    return 'BUKA_KEMBALI';
  }
  return 'UPDATE_STATUS_LAPANGAN';
}

/**
 * Evaluasi Otorisasi Berdasarkan Matriks Role & Konteks Aktor (B6)
 */
export function bolehMelakukan(
  role: AppRole,
  aksi: AksiPengaduanRole,
  konteks?: {
    penerimaTugasId?: string | null;
    aktorId?: string | null;
    klasifikasi?: KlasifikasiPengaduan;
  }
): boolean {
  if (role === 'SUPERADMIN') return true;

  const allowedRoles = MATRIKS_IZIN_PENGADUAN[aksi];
  if (!allowedRoles || !allowedRoles.includes(role)) {
    return false;
  }

  // Khusus staf billing pada verifikasi: hanya jika klasifikasi tagihan
  if (aksi === 'VERIFIKASI' && (role === 'STAFF_ADMIN_BILLING' || role === 'STAFF')) {
    if (konteks?.klasifikasi && konteks.klasifikasi !== 'NILAI_TAGIHAN_REKENING') {
      return false;
    }
  }

  // Khusus pelaksana lapangan pada update status lapangan: harus petugas yang ditugaskan
  if (aksi === 'UPDATE_STATUS_LAPANGAN' && role === 'PELAKSANA') {
    if (
      konteks?.penerimaTugasId &&
      konteks?.aktorId &&
      konteks.penerimaTugasId !== konteks.aktorId
    ) {
      return false;
    }
  }

  // Khusus pelaksana lapangan pada eskalasi: harus petugas yang ditugaskan
  if (aksi === 'ESKALASI' && role === 'PELAKSANA') {
    if (
      konteks?.penerimaTugasId &&
      konteks?.aktorId &&
      konteks.penerimaTugasId !== konteks.aktorId
    ) {
      return false;
    }
  }

  return true;
}
