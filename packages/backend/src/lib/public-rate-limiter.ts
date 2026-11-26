import crypto from 'node:crypto';

/**
 * Modul In-Memory Rate Limiter & Verifikasi Kontak Publik (Fase 5)
 * Keterbatasan: In-memory pada proses server tunggal (tidak terdistribusi antar multi-instance).
 */

interface PercobaanRecord {
  count: number;
  resetAt: number;
}

const percobaanMap = new Map<string, PercobaanRecord>();

/**
 * Memeriksa apakah IP + nomorTiket melebihi batas 5 percobaan gagal per 15 menit.
 */
export function cekBatasPercobaan(
  ip: string,
  nomorTiket: string
): { boleh: boolean; sisaDetik?: number } {
  const key = `${ip}:${nomorTiket}`;
  const now = Date.now();
  const record = percobaanMap.get(key);

  if (!record) {
    return { boleh: true };
  }

  if (now > record.resetAt) {
    percobaanMap.delete(key);
    return { boleh: true };
  }

  if (record.count >= 5) {
    const sisaDetik = Math.ceil((record.resetAt - now) / 1000);
    return { boleh: false, sisaDetik };
  }

  return { boleh: true };
}

/**
 * Mencatat percobaan verifikasi yang gagal
 */
export function catatKegagalanPercobaan(ip: string, nomorTiket: string): void {
  const key = `${ip}:${nomorTiket}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 menit
  const record = percobaanMap.get(key);

  if (!record || now > record.resetAt) {
    percobaanMap.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    record.count++;
  }
}

/**
 * Menghapus catatan percobaan saat verifikasi berhasil
 */
export function resetPercobaan(ip: string, nomorTiket: string): void {
  percobaanMap.delete(`${ip}:${nomorTiket}`);
}

/**
 * Verifikasi 4 digit terakhir kontak pelapor menggunakan perbandingan waktu konstan (timing-safe)
 */
export function verifikasiEmpatDigitKontak(
  kontakAsli: string | null | undefined,
  empatDigitInput: string
): boolean {
  if (!kontakAsli || typeof kontakAsli !== 'string') return false;

  const digits = kontakAsli.replace(/\D/g, '');
  if (digits.length < 4) return false;

  const fourLastExpected = digits.slice(-4);
  const inputDigits = (empatDigitInput ?? '').replace(/\D/g, '');
  if (inputDigits.length !== 4) return false;

  const bufA = Buffer.from(fourLastExpected, 'utf8');
  const bufB = Buffer.from(inputDigits, 'utf8');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Menyamarkan nama pelapor untuk respon publik (contoh: "Ahmad Dani" -> "Ahm*** Da**")
 */
export function samarkanNama(nama: string): string {
  if (!nama) return 'Warga';
  const parts = nama.trim().split(/\s+/);
  return parts
    .map((p) => {
      if (p.length <= 2) return p[0] + '*';
      if (p.length <= 4) return p.slice(0, 2) + '*'.repeat(p.length - 2);
      return p.slice(0, 3) + '*'.repeat(p.length - 3);
    })
    .join(' ');
}
