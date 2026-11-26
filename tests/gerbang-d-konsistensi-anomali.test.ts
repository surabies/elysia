import { describe, expect, it } from 'bun:test';
import { db, caterBacaMeter } from '@cater/db';
import { eq, sql } from 'drizzle-orm';
import { dashboardService } from '../packages/backend/src/services/core/dashboard/dashboard.service';
import { caterProgressService } from '../packages/backend/src/services/pencatat-meter/cater/cater-progress.service';
import { analyticsService } from '../packages/backend/src/services/core/dashboard/analytics.service';
import { verifikasiGridService } from '../packages/backend/src/services/pencatat-meter/cater/verifikasi-grid.service';

describe('Audit Gerbang D: Konsistensi Hitungan Anomali Lintas Semua Konsumen', () => {
  const TARGET_PERIODE = '202611';

  it('1. Verifikasi Konsistensi Periode 202611: Dashboard KPI == Progres Cater == Analitik == Header Grid == Filter HanyaAnomali', async () => {
    // A. Baseline Database Langsung
    const [dbCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .where(sql`${caterBacaMeter.thbl} = ${TARGET_PERIODE} AND ${caterBacaMeter.isAnomali} = true`);
    const totalDb = Number(dbCount.count);

    // B. Dashboard KPI Overview
    const dashboardOverview = await dashboardService.getExecutiveSummary(TARGET_PERIODE);
    const countDashboard = dashboardOverview.totalAnomali;

    // C. Cater Progress Monitoring (Radar Anomali)
    const caterProgress = await caterProgressService.getAnomaliKubikasi(TARGET_PERIODE);
    const countCaterProgress = caterProgress.kpi.totalAnomali;

    // D. Analytics Executive Summary (Tren Harian)
    const analyticsTrends = await analyticsService.getDailyTrends(TARGET_PERIODE, 14238);
    const countAnalytics = analyticsTrends.reduce((sum, d) => sum + (d.anomali || 0), 0);

    // E. Header Verifikasi Grid Stats
    const verifStats = await verifikasiGridService.getLaporanStats(TARGET_PERIODE);
    const countVerifHeader = verifStats.anomali ?? 0;

    // F. Filter Grid "Hanya Anomali"
    const gridFilter = await verifikasiGridService.getLaporanRows({
      periode: TARGET_PERIODE,
      hanyaAnomali: 'true',
      pageSize: 1,
    });
    const countGridHanyaAnomali = gridFilter.total;

    console.log('--- HASIL AUDIT KONSISTENSI ANOMALI PERIODE 202611 ---');
    console.log(`1. SSOT Database (is_anomali=true) : ${totalDb}`);
    console.log(`2. Dashboard KPI Overview           : ${countDashboard}`);
    console.log(`3. Cater Progress KPI               : ${countCaterProgress}`);
    console.log(`4. Analytics Tren Harian            : ${countAnalytics}`);
    console.log(`5. Header Verifikasi Grid Stats     : ${countVerifHeader}`);
    console.log(`6. Filter Grid "Hanya Anomali"      : ${countGridHanyaAnomali}`);

    // SELURUH KONSUMEN WAJIB 100% IDENTIK
    expect(countDashboard).toBe(totalDb);
    expect(countCaterProgress).toBe(totalDb);
    expect(countAnalytics).toBe(totalDb);
    expect(countVerifHeader).toBe(totalDb);
    expect(countGridHanyaAnomali).toBe(totalDb);
  }, 30000);

  it('2. Verifikasi Konsistensi Periode 202610: Dashboard KPI == Progres Cater == Header Grid == Filter HanyaAnomali', async () => {
    const PERIODE_2 = '202610';

    const [dbCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .where(sql`${caterBacaMeter.thbl} = ${PERIODE_2} AND ${caterBacaMeter.isAnomali} = true`);
    const totalDb = Number(dbCount.count);

    const dashboardOverview = await dashboardService.getExecutiveSummary(PERIODE_2);
    const caterProgress = await caterProgressService.getAnomaliKubikasi(PERIODE_2);
    const verifStats = await verifikasiGridService.getLaporanStats(PERIODE_2);
    const gridFilter = await verifikasiGridService.getLaporanRows({
      periode: PERIODE_2,
      hanyaAnomali: 'true',
      pageSize: 1,
    });
    const countGridHanyaAnomali = gridFilter.total;

    console.log('--- HASIL AUDIT KONSISTENSI ANOMALI PERIODE 202610 ---');
    console.log(`1. SSOT Database (is_anomali=true) : ${totalDb}`);
    console.log(`2. Dashboard KPI Overview           : ${dashboardOverview.totalAnomali}`);
    console.log(`3. Cater Progress KPI               : ${caterProgress.kpi.totalAnomali}`);
    console.log(`4. Header Verifikasi Grid Stats     : ${verifStats.anomali}`);
    console.log(`5. Filter Grid "Hanya Anomali"      : ${countGridHanyaAnomali}`);

    expect(dashboardOverview.totalAnomali).toBe(totalDb);
    expect(caterProgress.kpi.totalAnomali).toBe(totalDb);
    expect(verifStats.anomali).toBe(totalDb);
    expect(countGridHanyaAnomali).toBe(totalDb);
  }, 30000);

  it('3. Pemisahan Tegas Klasifikasi Anomali vs Peringatan (WARN_*)', async () => {
    // Peringatan tidak boleh masuk ke hitungan is_anomali=true
    const [warnAsAnom] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .where(
        sql`${caterBacaMeter.isAnomali} = true AND ${caterBacaMeter.kodeAnomaliUtama} LIKE 'WARN_%'`
      );

    expect(Number(warnAsAnom.count)).toBe(0);

    // Semua anomali non-WARN wajib memiliki is_anomali=true
    const [anomAsFalse] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .where(
        sql`${caterBacaMeter.isAnomali} = false AND ${caterBacaMeter.kodeAnomaliUtama} IS NOT NULL AND ${caterBacaMeter.kodeAnomaliUtama} NOT LIKE 'WARN_%'`
      );

    expect(Number(anomAsFalse.count)).toBe(0);
  });
});
