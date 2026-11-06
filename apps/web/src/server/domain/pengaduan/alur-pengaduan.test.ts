import { describe, it, expect } from 'bun:test';
import {
  generateNomorTiket,
  POLA_NOMOR_TIKET,
  isTransisiSah,
  hitungTargetSla,
  evaluasiPembuatanTiket,
} from './alur-pengaduan.engine';

describe('Domain Engine: Alur Pengaduan Air (State Machine & SLA)', () => {
  it('1. generateNomorTiket menghasilkan format Crockford Base32 yang valid', () => {
    const tiket = generateNomorTiket();
    expect(tiket).toBeDefined();
    expect(POLA_NOMOR_TIKET.test(tiket)).toBe(true);
    expect(tiket.startsWith('TW-')).toBe(true);

    // Pastikan 10 tiket berturut-turut unik (tidak ada duplikasi)
    const setTiket = new Set<string>();
    for (let i = 0; i < 10; i++) {
      setTiket.add(generateNomorTiket());
    }
    expect(setTiket.size).toBe(10);
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
