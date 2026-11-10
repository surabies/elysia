import { describe, expect, it } from 'bun:test';
import { drdService } from '../apps/web/src/server/services/dashboard/drd.service';
import { calculateNiceMax, truncateChartLabel } from '../apps/web/src/components/charts/vercel-bar-chart';

describe('Vercel Chart Styling & DRD Summary Integration', () => {
  it('harus dapat mengambil data ringkasan DRD dengan struktur chart lengkap', async () => {
    const pageData = await drdService.getPageData({ tab: 'ringkasan' });
    expect(pageData).toBeDefined();
    expect(pageData.tab).toBe('ringkasan');
    expect(pageData.ringkasan).toBeDefined();

    const summary = pageData.ringkasan!;
    expect(summary.dataKelurahan).toBeDefined();
    expect(Array.isArray(summary.dataKelurahan)).toBe(true);

    expect(summary.dataCakupan).toBeDefined();
    expect(Array.isArray(summary.dataCakupan)).toBe(true);

    expect(summary.dataDomestik).toBeDefined();
    expect(Array.isArray(summary.dataDomestik)).toBe(true);

    expect(summary.dataTarif).toBeDefined();
    expect(Array.isArray(summary.dataTarif)).toBe(true);

    expect(summary.dataTaaKelurahan).toBeDefined();
    expect(Array.isArray(summary.dataTaaKelurahan)).toBe(true);

    expect(summary.dataTaaStatus).toBeDefined();
    expect(typeof summary.dataTaaStatus.normal).toBe('number');
    expect(typeof summary.dataTaaStatus.taa).toBe('number');
    expect(typeof summary.dataTaaStatus.persenTaa).toBe('number');

    expect(summary.dataTagihanKomposisi).toBeDefined();
    expect(typeof summary.dataTagihanKomposisi.hargaAir).toBe('number');
    expect(typeof summary.dataTagihanKomposisi.totalTagihan).toBe('number');
  });

  it('memverifikasi utilitas standar chart Vercel Visx', () => {
    expect(calculateNiceMax(120)).toBe(125);
    expect(calculateNiceMax(48000)).toBe(50000);
    expect(truncateChartLabel('Cibeunying Kaler', 8)).toBe('Cibeuny…');
    expect(truncateChartLabel('Coblong', 8)).toBe('Coblong');
  });
});
