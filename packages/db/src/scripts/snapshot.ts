import { db } from '../client';
import { sql } from 'drizzle-orm';

export async function captureSnapshot() {
  const perPeriode = await db.execute(sql`
    SELECT 
      thbl AS periode,
      COUNT(*)::int AS total_baris,
      COUNT(*) FILTER (WHERE is_anomali = true)::int AS total_anomali,
      COUNT(*) FILTER (WHERE is_anomali = false AND kode_anomali_utama LIKE 'WARN_%')::int AS total_peringatan,
      COUNT(*) FILTER (WHERE is_anomali = false AND (kode_anomali_utama IS NULL OR kode_anomali_utama = ''))::int AS total_normal
    FROM cater_baca_meter
    GROUP BY thbl
    ORDER BY thbl;
  `);
  console.log('=== REKAP PER PERIODE ===');
  console.table(perPeriode);

  const perKode = await db.execute(sql`
    SELECT 
      thbl AS periode,
      COALESCE(kode_anomali_utama, 'NORMAL') AS kode_anomali,
      COUNT(*)::int AS jumlah
    FROM cater_baca_meter
    GROUP BY thbl, kode_anomali_utama
    ORDER BY thbl, jumlah DESC;
  `);
  console.log('=== RINCIAN PER KODE ===');
  console.table(perKode);

  return { perPeriode, perKode };
}

if (import.meta.main) {
  captureSnapshot()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
