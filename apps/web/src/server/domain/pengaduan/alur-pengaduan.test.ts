import { describe, it, expect } from 'bun:test';
import {
  generateNomorTiket,
  parseNomorTiket,
  POLA_NOMOR_TIKET,
  isTransisiSah,
  hitungTargetSla,
  evaluasiPembuatanTiket,
} from './alur-pengaduan.engine';

describe('Domain Engine: Alur Pengaduan Air (State Machine & SLA)', () => {
  it('1. generateNomorTiket menghasilkan format [KODE][WILAYAH][TANGGAL][URUT] tanpa simbol', () => {
    // Pengujian deterministic
    const tiket = generateNomorTiket({
      kode: 'TK',
      wilayah: '05',
      tanggal: new Date('2026-11-06T03:00:00Z'), // 10:00 WIB
      urut: 1,
    });

    expect(tiket).toBe('TK052611060001');
    expect(tiket.length).toBe(14);
    expect(tiket.includes('-')).toBe(false);
    expect(POLA_NOMOR_TIKET.test(tiket)).toBe(true);

    // Parse kembali nomor tiket
    const parsed = parseNomorTiket(tiket);
    expect(parsed.valid).toBe(true);
    expect(parsed.kode).toBe('TK');
    expect(parsed.wilayah).toBe('05');
    expect(parsed.tanggalStr).toBe('261106');
    expect(parsed.tahun).toBe(2026);
    expect(parsed.bulan).toBe(11);
    expect(parsed.hari).toBe(6);
    expect(parsed.urut).toBe(1);

    // Format lama yang mengandung tanda minus harus ditolak
    expect(POLA_NOMOR_TIKET.test('TW-2607-4F2A9K')).toBe(false);
  });

  it('2. isTransisiSah menegakkan whitelist alur kerja tiket', () => {
    // Alur normal yang sah
    expect(isTransisiSah('BARU', 'TERVERIFIKASI')).toBe(true);
    expect(isTransisiSah('BARU', 'DITUGASKAN')).toBe(true);
    expect(isTransisiSah('DITUGASKAN', 'MENUJU_LOKASI')).toBe(true);
    expect(isTransisiSah('MENUJU_LOKASI', 'DIPROSES')).toBe(true);
    expect(isTransisiSah('DIPROSES', 'SELESAI')).toBe(true);
    expect(isTransisiSah('SELESAI', 'DITUTUP')).toBe(true);

    // Alur yang dilarang (invalid)
    expect(isTransisiSah('BARU', 'SELESAI')).toBe(false);
    expect(isTransisiSah('BARU', 'DIPROSES')).toBe(false);
    expect(isTransisiSah('DITUTUP', 'DIPROSES')).toBe(false);
    expect(isTransisiSah('DITUTUP', 'DIBUKA_KEMBALI')).toBe(false);
  });

  it('3. hitungTargetSla menghitung jam respons dan selesai berdasarkan tingkat prioritas', () => {
    const base = new Date('2026-05-01T08:00:00Z');
    
    // DARURAT: 1 jam respons, 6 jam selesai
    const slaDarurat = hitungTargetSla('DARURAT', base);
    expect(slaDarurat.targetResponsAt.getTime() - base.getTime()).toBe(1 * 60 * 60 * 1000);
    expect(slaDarurat.targetSelesaiAt.getTime() - base.getTime()).toBe(6 * 60 * 60 * 1000);

    // NORMAL: 6 jam respons, 48 jam selesai
    const slaNormal = hitungTargetSla('NORMAL', base);
    expect(slaNormal.targetResponsAt.getTime() - base.getTime()).toBe(6 * 60 * 60 * 1000);
    expect(slaNormal.targetSelesaiAt.getTime() - base.getTime()).toBe(48 * 60 * 60 * 1000);
  });

  it('4. evaluasiPembuatanTiket mewajibkan koordinat GPS untuk Bocor Pipa Dinas', () => {
    const bocorTanpaGps = evaluasiPembuatanTiket({
      jenis: 'BOCOR_PIPA_DINAS',
      pelapor: 'Ahmad',
    });
    expect(bocorTanpaGps.valid).toBe(false);
    expect(bocorTanpaGps.pesanError).toContain('koordinat');

    const bocorDenganGps = evaluasiPembuatanTiket({
      jenis: 'BOCOR_PIPA_DINAS',
      pelapor: 'Ahmad',
      koordinat: { x: 107.6186, y: -6.9175 },
    });
    expect(bocorDenganGps.valid).toBe(true);
  });
});
