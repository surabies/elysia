import { db } from '../../client';
import { periodePenagihan } from '../../schema/periode';
import { rekeningDrd } from '../../schema/billing';
import { daftarCatat } from '../../schema/dpm';
import { carryForwardPeriode, nextPeriode } from '../../carry-forward';
import { eq, sql, desc } from 'drizzle-orm';
import type { SeedModule, SeedOptions } from '../types';

/**
 * Modul Seed Periode Dinamis (Tanpa Hardcode Bulan/Tahun & Tanpa Angka Snapshot Palsu)
 * Menyelaraskan periode_penagihan dengan data aktual di rekening_drd & daftar_catat.
 */
export async function seedPeriode() {
  // Cari periode yang memiliki data DRD (periode closed)
  const closedPeriods = await db
    .select({
      thbl: rekeningDrd.thbl,
      totalSl: sql<number>`count(*)::int`,
      totalM3: sql<string>`coalesce(sum(${rekeningDrd.pakaiM3}::numeric), 0)::numeric(12,2)::text`,
      totalTagihan: sql<string>`coalesce(sum(${rekeningDrd.totalTagihan}::numeric), 0)::numeric(15,2)::text`,
    })
    .from(rekeningDrd)
    .groupBy(rekeningDrd.thbl)
    .orderBy(desc(rekeningDrd.thbl));

  let count = 0;

  for (const cp of closedPeriods) {
    const yearNum = parseInt(cp.thbl.slice(0, 4), 10);
    const monthNum = parseInt(cp.thbl.slice(4, 6), 10);
    const jatuhTempo = new Date(Date.UTC(yearNum, monthNum - 1, 20, 0, 0, 0));
    const ditutupAt = new Date(Date.UTC(yearNum, monthNum - 1, 28, 17, 0, 0));

    await db
      .insert(periodePenagihan)
      .values({
        periode: cp.thbl,
        status: 'TERKUNCI',
        tanggalJatuhTempo: jatuhTempo,
        ditutupAt,
        jumlahSl: cp.totalSl,
        totalM3: cp.totalM3,
        totalTagihan: cp.totalTagihan,
      })
      .onConflictDoUpdate({
        target: periodePenagihan.periode,
        set: {
          status: 'TERKUNCI',
          jumlahSl: cp.totalSl,
          totalM3: cp.totalM3,
          totalTagihan: cp.totalTagihan,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  // Pastikan periode berikutnya (N+1 dari periode closed terbaru) sudah dibuka via carryForwardPeriode
  if (closedPeriods.length > 0) {
    const latestClosed = closedPeriods[0].thbl;
    const openPeriode = nextPeriode(latestClosed);
    const [existingOpenDpm] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(daftarCatat)
      .where(eq(daftarCatat.periode, openPeriode));

    if (!existingOpenDpm || existingOpenDpm.cnt === 0) {
      await carryForwardPeriode({
        periodeLalu: latestClosed,
        periodeBaru: openPeriode,
        userId: null,
      });
    }
    count++;
  }

  return {
    count,
    message: `Synced ${count} siklus periode penagihan dari data aktual database.`,
  };
}

export const periodeModule: SeedModule = {
  id: 'periode',
  name: 'Periode Billing & Siklus Penagihan',
  description: 'Sinkronisasi siklus periode penagihan secara dinamis dari data transaksi',
  run: async (_options: SeedOptions) => {
    return await seedPeriode();
  },
};
