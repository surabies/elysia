import { db } from '@cater/db';
import { sql } from 'drizzle-orm';
import { execSync } from 'child_process';

async function getCounts() {
  const r = await db.execute(sql`
    SELECT 
      COALESCE(kode_anomali_utama, 'NORMAL_BERSIH') AS kode,
      is_anomali,
      COUNT(*)::int AS cnt
    FROM cater_baca_meter
    WHERE thbl = '202611'
    GROUP BY kode_anomali_utama, is_anomali
    ORDER BY kode ASC, is_anomali ASC
  `);
  return r;
}

async function main() {
  console.log('1. Mengambil hitungan baseline SEBELUM test suite...');
  const before = await getCounts();
  console.table(before);

  console.log('2. Menjalankan seluruh test suite...');
  execSync('bun test tests/catchup-and-guard.test.ts tests/gerbang-c-ui-aturan.test.ts apps/web/src/server/domain/cater/anomali-evaluasi.test.ts tests/six-cases.test.ts tests/jalur-penulisan-evaluator.test.ts tests/gerbang-d-konsistensi-anomali.test.ts', { stdio: 'inherit' });

  console.log('3. Mengambil hitungan baseline SESUDAH test suite...');
  const after = await getCounts();
  console.table(after);

  console.log('4. Memeriksa perbedaan SEBELUM vs SESUDAH...');
  let hasDiff = false;
  const beforeMap = new Map(before.map((b: any) => [`${b.kode}|${b.is_anomali}`, b.cnt]));
  const afterMap = new Map(after.map((a: any) => [`${a.kode}|${a.is_anomali}`, a.cnt]));

  const allKeys = Array.from(new Set([...beforeMap.keys(), ...afterMap.keys()])).sort();
  for (const k of allKeys) {
    const bCnt = beforeMap.get(k) || 0;
    const aCnt = afterMap.get(k) || 0;
    if (bCnt !== aCnt) {
      console.error(`PERBEDAAN TERDETEKSI pada ${k}: sebelum=${bCnt}, sesudah=${aCnt} (selisih: ${aCnt - bCnt})`);
      hasDiff = true;
    }
  }

  if (!hasDiff) {
    console.log('HASIL: 100% IDENTIK! Tidak ada pergeseran baris atau hitungan per kode sama sekali sebelum dan sesudah test suite!');
  } else {
    process.exit(1);
  }
}

main().catch(console.error);
