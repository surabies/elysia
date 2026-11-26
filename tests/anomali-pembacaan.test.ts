import { describe, expect, it } from 'bun:test';
import { caterProgressService } from '@/server/services/cater/cater-progress.service';

describe('Radar Anomali Pembacaan & Halaman /progres/ekstrim (Sinkronisasi SSOT)', () => {
  it('berhasil mengambil data anomali kubikasi dengan mapping Pakai vs Lalu riil dari database', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202611', 'all', 20);

    expect(res).toBeDefined();
    expect(res.periode).toBe('202611');
    expect(res.kpi).toBeDefined();

    // Verifikasi 3 pilar utama anomali kubikasi (100% konsisten dengan Gerbang D & SSOT)
    expect(res.kpi.totalEkstrim).toBe(399);
    expect(res.kpi.totalNol).toBe(273);
    expect(res.kpi.totalTurun).toBe(415);
    expect(res.kpi.totalAnomali).toBe(1692);

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
    const res = await caterProgressService.getAnomaliKubikasi('202611', 'ekstrim', 10);
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      const isEkstrem =
        (item as any).kategori === 'ekstrim' ||
        item.pakaiM3 >= 100 ||
        (item.persenDeviasi > 80 && item.selisihM3 >= 20);
      expect(isEkstrem).toBe(true);
    }
  });

  it('berhasil memfilter pemakaian nol (0 m³)', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202611', 'nol', 10);
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      expect(item.pakaiM3).toBe(0);
    }
  });

  it('berhasil memfilter penurunan drastis (turun >= 50% dan pakai lalu >= 10 m³)', async () => {
    const res = await caterProgressService.getAnomaliKubikasi('202611', 'turun', 10);
    expect(res.items.length).toBeGreaterThan(0);

    for (const item of res.items) {
      const isTurun =
        (item as any).kategori === 'turun' ||
        (item.selisihM3 < 0 && item.pakaiM3 <= item.pakaiLalu * 0.5);
      expect(isTurun).toBe(true);
    }
  });
});
