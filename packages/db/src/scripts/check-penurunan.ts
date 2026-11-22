import { db } from '../client';
import { sql } from 'drizzle-orm';

async function main() {
  const res = await db.execute(sql`
    SELECT 
      thbl,
      COUNT(*) AS total_in_list,
      COUNT(*) FILTER (WHERE kode_anomali_utama = 'ANOM_DEVIASI_RING2') AS utama_ring2,
      COUNT(*) FILTER (WHERE kode_anomali_utama = 'ANOM_DEVIASI_RING3') AS utama_ring3,
      COUNT(*) FILTER (WHERE kode_anomali_utama = 'ANOM_PENURUNAN_PERSEN') AS utama_penurunan
    FROM cater_baca_meter
    WHERE 'ANOM_PENURUNAN_PERSEN' = ANY(kode_anomali_list)
    GROUP BY thbl
    ORDER BY thbl;
  `);
  console.table(res);
  process.exit(0);
}
main();
