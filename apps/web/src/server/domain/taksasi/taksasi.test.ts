import { describe, it, expect } from 'bun:test';
import {
  hitungTaksasi,
  hitungRollover,
  PEMAKAIAN_MINIMUM_PERDIR,
} from './taksasi.engine';

describe('Domain Engine: Taksasi Manual & Rollover', () => {
  const targetPeriode = new Date('2026-05-01T00:00:00Z');

  it('1. Taksasi tanpa histori harus mengembalikan nilai minimum Perdir jika stand tersedia', () => {
    const res = hitungTaksasi([], targetPeriode, {
      id: 'stand-1',
      periode: new Date('2026-04-01T00:00:00Z'),
      standAkhir: 1500,
    });
    expect(res.pemakaian).toBe(PEMAKAIAN_MINIMUM_PERDIR);
    expect(res.bolehDitambahkan).toBe(true);
    expect(res.metode).toBe('TANPA_HISTORI');
    expect(res.standAwalTerakhir).toBe(1500);
  });

  it('2. Taksasi menolak penambahan jika stand resmi sebelumnya belum ada', () => {
    const res = hitungTaksasi([], targetPeriode, null);
    expect(res.pemakaian).toBeNull();
    expect(res.bolehDitambahkan).toBe(false);
    expect(res.alasanPeninjauan).toContain('belum tersedia');
  });

  it('3. Taksasi dengan 3 histori harus mengambil rata-rata 3 tertinggi', () => {
    const riwayat = [
      { id: '1', periode: '2026-04-01T00:00:00Z', pemakaianM3: 20 },
      { id: '2', periode: '2026-03-01T00:00:00Z', pemakaianM3: 30 },
      { id: '3', periode: '2026-02-01T00:00:00Z', pemakaianM3: 25 },
      { id: '4', periode: '2026-01-01T00:00:00Z', pemakaianM3: 15 },
    ];
    const res = hitungTaksasi(riwayat, targetPeriode, {
      id: 'stand-1',
      periode: '2026-04-01T00:00:00Z',
      standAkhir: 1500,
    });
    // 3 tertinggi: 30, 25, 20 -> Rata-rata = 75 / 3 = 25
    expect(res.pemakaian).toBe(25);
    expect(res.metode).toBe('TIGA_TERTINGGI');
  });

  it('4. hitungRollover meter 4 digit: 9990 ke 0015 = 25 m3', () => {
    const res = hitungRollover(9990, 15, 4);
    expect(res.isRollover).toBe(true);
    expect(res.pemakaianM3).toBe(25);
  });

  it('5. hitungRollover normal jika stma >= stml', () => {
    const res = hitungRollover(100, 125);
    expect(res.isRollover).toBe(false);
    expect(res.pemakaianM3).toBe(25);
  });
});
