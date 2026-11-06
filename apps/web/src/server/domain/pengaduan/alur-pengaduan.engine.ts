/**
 * Domain Engine: Alur Pengaduan Air & State Machine Tiket
 * Lapisan: 1. Domain Engine (Pure Business Logic - Zero DB & Zero HTTP dependencies)
 */

import { randomInt } from 'node:crypto';
import type {
  StatusPengaduan,
  PrioritasPengaduan,
  JenisPengaduan,
  AppRole,
} from '@cater/types';

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
 */
export function isTransisiSah(dari: StatusPengaduan, ke: StatusPengaduan): boolean {
  const targetSah = TRANSISI_PENGADUAN[dari];
  return targetSah ? targetSah.includes(ke) : false;
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
 */
export function hitungTargetSla(
  prioritas: PrioritasPengaduan,
  mulai: Date = new Date()
): { targetResponsAt: Date; targetSelesaiAt: Date } {
  const sla = SLA_PRIORITAS[prioritas] ?? SLA_PRIORITAS.NORMAL;
  const targetResponsAt = new Date(mulai.getTime() + sla.responsJam * 60 * 60 * 1000);
  const targetSelesaiAt = new Date(mulai.getTime() + sla.selesaiJam * 60 * 60 * 1000);

  return { targetResponsAt, targetSelesaiAt };
}

/**
 * Evaluasi Kelayakan Pembuatan Tiket (Aturan Khusus Jenis Pengaduan)
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

  return { valid: true };
}
