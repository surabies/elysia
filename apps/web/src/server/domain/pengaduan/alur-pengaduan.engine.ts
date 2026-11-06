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

// Alfabet Base32 Crockford (tanpa I, L, O, U)
export const ALFABET_CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const PREFIX_TIKET = 'TW';
export const POLA_NOMOR_TIKET = /^TW-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/;

/**
 * Pembangkit Nomor Tiket Acak Berbasis Kriptografis (CSPRNG)
 * Format: TW-YYMM-XXXXXX (misal TW-2605-4F2A9K)
 * Menggunakan WIB (UTC+7)
 */
export function generateNomorTiket(tgl: Date = new Date()): string {
  const wibTime = new Date(tgl.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(wibTime.getUTCFullYear()).slice(-2);
  const mm = String(wibTime.getUTCMonth() + 1).padStart(2, '0');

  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += ALFABET_CROCKFORD[randomInt(ALFABET_CROCKFORD.length)];
  }

  return `${PREFIX_TIKET}-${yy}${mm}-${randomPart}`;
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
