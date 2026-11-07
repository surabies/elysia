import { describe, it, expect } from 'bun:test';
import {
  evaluasiPemakaianMeter,
  hitungDeviasiPersentase,
} from './cater-anomali.engine';

describe('Domain Engine: hitungDeviasiPersentase', () => {
  it('menghitung perubahan konsumsi relatif terhadap periode sebelumnya', () => {
    expect(hitungDeviasiPersentase(30, 20)).toBe(50);
    expect(hitungDeviasiPersentase(10, 20)).toBe(-50);
    expect(hitungDeviasiPersentase(20, 20)).toBe(0);
    expect(hitungDeviasiPersentase(0, 20)).toBe(-100);
  });

  it('menghasilkan null jika data sebelumnya tidak ada atau nol', () => {
    expect(hitungDeviasiPersentase(20, null)).toBeNull();
    expect(hitungDeviasiPersentase(null, 20)).toBeNull();
    expect(hitungDeviasiPersentase(20, 0)).toBeNull();
  });
});

describe('Domain Engine: evaluasiPemakaianMeter', () => {
  it('harus menghitung pemakaian normal secara presisi', () => {
    const res = evaluasiPemakaianMeter({ stml: 100, stma: 125, pakaiLalu: 20 });
    expect(res.pakaiM3).toBe(25);
    expect(res.isAnomali).toBe(false);
    expect(res.statusVerifikasi).toBe('SUBMITTED');
  });

  it('harus mendeteksi anomali negatif jika meter mundur', () => {
    const res = evaluasiPemakaianMeter({ stml: 150, stma: 140 });
    expect(res.pakaiM3).toBe(-10);
    expect(res.isAnomali).toBe(true);
    expect(res.statusVerifikasi).toBe('ANOMALY_NEGATIVE');
  });

  it('harus mendeteksi lonjakan tinggi jika pakaiM3 > 100 m³', () => {
    const res = evaluasiPemakaianMeter({ stml: 50, stma: 180, pakaiLalu: 25 });
    expect(res.pakaiM3).toBe(130);
    expect(res.isAnomali).toBe(true);
    expect(res.statusVerifikasi).toBe('ANOMALY_HIGH');
  });

  it('harus mendeteksi lonjakan tinggi jika pemakaian melonjak 3x lipat dari lalu', () => {
    const res = evaluasiPemakaianMeter({ stml: 10, stma: 45, pakaiLalu: 10 });
    expect(res.pakaiM3).toBe(35);
    expect(res.isAnomali).toBe(true);
    expect(res.statusVerifikasi).toBe('ANOMALY_HIGH');
  });

  it('harus mendeteksi pemakaian nol berulang', () => {
    const res = evaluasiPemakaianMeter({ stml: 200, stma: 200, pakaiLalu: 0 });
    expect(res.pakaiM3).toBe(0);
    expect(res.isAnomali).toBe(true);
    expect(res.statusVerifikasi).toBe('ANOMALY_LOW');
  });
});
