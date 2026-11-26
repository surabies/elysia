import postgres from 'postgres';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const perKode202611 = await sql`
    SELECT 
      COALESCE(kode_anomali_utama, 'NORMAL_BERSIH') AS kode,
      is_anomali,
      COUNT(*)::int AS cnt
    FROM cater_baca_meter
    WHERE thbl = '202611'
    GROUP BY kode_anomali_utama, is_anomali
    ORDER BY cnt DESC
  `;
  console.log('--- ACTUAL SSOT COUNTS 202611 ---');
  console.table(perKode202611);

  const perKode202610 = await sql`
    SELECT 
      COALESCE(kode_anomali_utama, 'NORMAL_BERSIH') AS kode,
      is_anomali,
      COUNT(*)::int AS cnt
    FROM cater_baca_meter
    WHERE thbl = '202610'
    GROUP BY kode_anomali_utama, is_anomali
    ORDER BY cnt DESC
  `;
  console.log('--- ACTUAL SSOT COUNTS 202610 ---');
  console.table(perKode202610);

  await sql.end();
}

main().catch(console.error);
