import { describe, expect, it } from 'bun:test';
import { evaluasiPemakaianMeter } from '../apps/web/src/server/domain/cater/cater-anomali.engine';

describe('Cater reading logic used by the database-backed simulator', () => {
  it('evaluates a normal reading', () => {
    const result = evaluasiPemakaianMeter({ stml: 100, stma: 120, pakaiLalu: 18 });

    expect(result.pakaiM3).toBe(20);
    expect(result.statusVerifikasi).toBe('SUBMITTED');
  });

  it('flags high consumption', () => {
    const result = evaluasiPemakaianMeter({ stml: 100, stma: 201, pakaiLalu: 20 });

    expect(result.statusVerifikasi).toBe('ANOMALY_HIGH');
  });

  it('flags a decreasing meter stand', () => {
    const result = evaluasiPemakaianMeter({ stml: 100, stma: 90, pakaiLalu: 20 });

    expect(result.statusVerifikasi).toBe('ANOMALY_NEGATIVE');
  });

  it('flags repeated zero consumption', () => {
    const result = evaluasiPemakaianMeter({ stml: 100, stma: 100, pakaiLalu: 0 });

    expect(result.statusVerifikasi).toBe('ANOMALY_LOW');
  });
});
