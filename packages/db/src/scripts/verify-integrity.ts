// packages/db/src/scripts/verify-integrity.ts
// Query Integritas Gerbang A: Validasi Nol Pelanggaran
import { db } from '../client';
import { sql } from 'drizzle-orm';

export async function verifyIntegrity() {
  console.log('====================================================');
  console.log('          VERIFIKASI INTEGRITAS GERBANG A          ');
  console.log('====================================================');

  // Pelanggaran 1: is_anomali = true tapi kode kosong atau WARN_%
  const [p1] = await db.execute(sql`
    SELECT COUNT(*)::int as count 
    FROM cater_baca_meter 
    WHERE is_anomali = true 
      AND (kode_anomali_utama IS NULL OR kode_anomali_utama = '' OR kode_anomali_utama LIKE 'WARN_%');
  `);

  // Pelanggaran 2: kode anomali non-WARN (ANOM_%) tapi is_anomali = false
  const [p2] = await db.execute(sql`
    SELECT COUNT(*)::int as count 
    FROM cater_baca_meter 
    WHERE is_anomali = false 
      AND (kode_anomali_utama LIKE 'ANOM_%');
  `);

  // Pelanggaran 3: aturan_versi bernilai NULL
  const [p3] = await db.execute(sql`
    SELECT COUNT(*)::int as count 
    FROM cater_baca_meter 
    WHERE aturan_versi IS NULL;
  `);

  // Konsistensi total baris
  const totals = await db.execute(sql`
    SELECT 
      thbl AS periode,
      COUNT(*)::int AS total_baris,
      (
        COUNT(*) FILTER (WHERE is_anomali = true) +
        COUNT(*) FILTER (WHERE is_anomali = false AND kode_anomali_utama LIKE 'WARN_%') +
        COUNT(*) FILTER (WHERE is_anomali = false AND (kode_anomali_utama IS NULL OR kode_anomali_utama = ''))
      )::int AS total_komponen
    FROM cater_baca_meter
    GROUP BY thbl
    ORDER BY thbl;
  `);

  console.log(`(a) is_anomali=true dengan kode kosong/WARN_% : ${p1.count} pelanggaran (Target: 0)`);
  console.log(`(b) kode ANOM_% tapi is_anomali=false        : ${p2.count} pelanggaran (Target: 0)`);
  console.log(`(c) aturan_versi IS NULL                     : ${p3.count} pelanggaran (Target: 0)`);
  console.log('Konsistensi Total per Periode:');
  console.table(totals);

  const passed = p1.count === 0 && p2.count === 0 && p3.count === 0 && 
    totals.every((t: any) => t.total_baris === t.total_komponen);

  if (!passed) {
    throw new Error('Integrity check failed: Ada pelanggaran data!');
  }

  console.log('HASIL: 100% BERSIH (0 PELANGGARAN). TOTAL ANOMALI + PERINGATAN + NORMAL = TOTAL BARIS.');
  return { p1: p1.count, p2: p2.count, p3: p3.count, totals };
}

if (import.meta.main) {
  verifyIntegrity()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
