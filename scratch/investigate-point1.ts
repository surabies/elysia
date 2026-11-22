import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

async function main() {
  const counts = await db.execute(sql`
    SELECT 
      is_anomali,
      kode_anomali_utama,
      COUNT(*)::int as cnt
    FROM cater_baca_meter
    WHERE thbl = '202611'
    GROUP BY is_anomali, kode_anomali_utama
    ORDER BY is_anomali DESC, cnt DESC
  `);
  console.log('Current counts in 202611:');
  console.table(counts);

  const totalAnomali = await db.execute(sql`
    SELECT COUNT(*)::int as cnt FROM cater_baca_meter WHERE thbl = '202611' AND is_anomali = true
  `);
  console.log('Total Anomali:', totalAnomali[0].cnt);

  const versions = await db.execute(sql`
    SELECT versi, alasan, diterbitkan_oleh, created_at
    FROM aturan_anomali_versi
    ORDER BY versi DESC
    LIMIT 10
  `);
  console.log('Versions:');
  console.table(versions);

  const audit = await db.execute(sql`
    SELECT id, aturan_id, aksi, alasan, diubah_oleh, waktu
    FROM aturan_anomali_audit_log
    ORDER BY waktu DESC
    LIMIT 10
  `);
  console.log('Recent audit logs:');
  console.table(audit);
}
main().catch(console.error);
