import { describe, expect, it } from 'bun:test';
import { caterProgressService } from '@/server/services/cater/cater-progress.service';

describe('Radar Anomali Pembacaan & Halaman /progres/ekstrim (Sinkronisasi SSOT)', () => {
  it('berhasil mengambil data anomali kubikasi dengan mapping Pakai vs Lalu riil dari database', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202601', 'all', 20);

    expect(res).toBeDefined();
    expect(res.periode).toBe('202601');
    expect(res.kpi).toBeDefined();

    // Verifikasi 3 pilar utama anomali kubikasi
    expect(res.kpi.totalEkstrim).toBe(632);
    expect(res.kpi.totalNol).toBe(375);
    expect(res.kpi.totalTurun).toBe(643);
    expect(res.kpi.totalAnomali).toBe(1650);

    expect(res.items.length).toBeGreaterThan(0);

    const first = res.items[0];
    expect(first.nolg).toBeDefined();
    expect(first.nama).toBeDefined();
    expect(typeof first.pakaiM3).toBe('number');
    expect(typeof first.pakaiLalu).toBe('number');
    expect(typeof first.selisihM3).toBe('number');
    expect(typeof first.persenDeviasi).toBe('number');
    expect(typeof first.rataRataHistoris).toBe('number');
  });

  it('berhasil memfilter kategori ekstrem (lonjakan tajam atau > 75 m³)', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202601', 'ekstrim', 10);
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      const isEkstrem =
        (item.pakaiLalu > 0 && item.pakaiM3 >= item.pakaiLalu * 2) ||
        (item.pakaiLalu > 0 && item.selisihM3 >= 30) ||
        item.pakaiM3 > 75 ||
        item.statusVerifikasi === 'ANOMALY_HIGH';
      expect(isEkstrem).toBeTrue();
    }
  });

  it('berhasil memfilter pemakaian nol (0 m³)', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202601', 'nol', 10);
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      expect(item.pakaiM3).toBe(0);
    }
  });

  it('berhasil memfilter penurunan drastis (turun >= 50% dan pakai lalu >= 10 m³)', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202601', 'turun', 10);
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      expect(item.pakaiLalu).toBeGreaterThanOrEqual(10);
      expect(item.pakaiM3).toBeLessThanOrEqual(item.pakaiLalu * 0.5);
    }
  });
});
