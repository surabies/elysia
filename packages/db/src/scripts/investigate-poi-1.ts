// packages/db/src/scripts/investigate-poi-1.ts
import { db } from '../client';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function main() {
  console.log('Investigasi mendalam selisih dry-run lama vs SSOT...');

  // 1. Kenapa ANOM_DEVIASI_RING3 di SSOT adalah 323 (sebelumnya 349)?
  // Di SSOT Rule Ring 3:
  // deviasi > 80% (strict > 80), syaratPakaiLaluMinM3 = 5 m3.
  // Di engine lama:
  // Apakah engine lama memakai deviasi >= 80% (inklusif 80)?
  // Atau apakah engine lama tidak memakai syaratPakaiLaluMinM3 = 5 m3 (misal syarat = 1 atau 0)?
  
  // A. Baris di 202611 dengan deviasi > 80% tetapi pakai_lalu < 5 m3:
  const ring3Kecil = await db.execute(sql`
    SELECT 
      c.id, c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_lalu, c.tmss,
      c.is_anomali, c.kode_anomali_utama, c.kode_anomali_list
    FROM cater_baca_meter c
    WHERE c.thbl = '202611'
      AND c.pakai_m3 > 0
      AND c.pakai_lalu > 0
      AND ABS((c.pakai_m3 - c.pakai_lalu) / c.pakai_lalu * 100) > 80
      AND c.pakai_lalu < 5;
  `);

  // B. Baris di 202611 dengan deviasi persis = 80% (batas inkusif vs eksklusif):
  const ring3Persis80 = await db.execute(sql`
    SELECT 
      c.id, c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_lalu, c.tmss,
      c.is_anomali, c.kode_anomali_utama
    FROM cater_baca_meter c
    WHERE c.thbl = '202611'
      AND c.pakai_m3 > 0
      AND c.pakai_lalu >= 5
      AND ABS((c.pakai_m3 - c.pakai_lalu) / c.pakai_lalu * 100) = 80;
  `);

  // C. Baris dengan pemakaian nol di 202611: kenapa di SSOT ada 9 baris ANOM_PEMAKAIAN_NOL (sebelumnya 5)?
  const pemakaianNolAnomali = await db.execute(sql`
    SELECT 
      c.id, c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_lalu, c.tmss,
      c.is_anomali, c.kode_anomali_utama,
      prev.tmss as prev_tmss, prev.pakai_m3 as prev_pakai_m3
    FROM cater_baca_meter c
    LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
      AND prev.thbl = '202610'
    WHERE c.thbl = '202611'
      AND c.kode_anomali_utama = 'ANOM_PEMAKAIAN_NOL';
  `);

  // D. Cari 22 baris di 202611 yang berubah dari Anomali ke Normal:
  // Di engine lama, apa saja yang dianggap anomali tapi di SSOT menjadi NORMAL (is_anomali = false AND kode_anomali_utama IS NULL)?
  // Mari cek kandidat:
  // 1) Deviasi persentase tinggi (>80% atau 50-80%) tetapi pakai_lalu < 5 m3 (seperti 1 m3 -> 2 m3, atau 2 m3 -> 1 m3).
  // Di engine lama, apakah baris-baris ini terkena deviasi?
  const kandidat22 = await db.execute(sql`
    SELECT 
      c.id, c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_lalu, c.tmss,
      ROUND(ABS((c.pakai_m3 - c.pakai_lalu) / NULLIF(c.pakai_lalu, 0) * 100), 2) as deviasi_persen
    FROM cater_baca_meter c
    WHERE c.thbl = '202611'
      AND c.is_anomali = false
      AND (c.kode_anomali_utama IS NULL OR c.kode_anomali_utama = '')
      AND c.pakai_lalu IS NOT NULL
      AND c.pakai_lalu > 0
      AND c.pakai_lalu < 5
      AND (
        ABS((c.pakai_m3 - c.pakai_lalu) / c.pakai_lalu * 100) >= 50
      )
    ORDER BY c.nolg ASC;
  `);

  console.log('Ring 3 Kecil (< 5 m3):', ring3Kecil.length);
  console.log('Ring 3 Persis 80%:', ring3Persis80.length);
  console.log('Pemakaian Nol Anomali di SSOT:', pemakaianNolAnomali.length);
  console.table(pemakaianNolAnomali);

  console.log(`Jumlah baris di 202611 yang di SSOT adalah NORMAL tetapi memiliki deviasi >= 50% pada pakai_lalu < 5 m3: ${kandidat22.length}`);
  console.table(kandidat22.slice(0, 25));

  fs.writeFileSync('C:/Users/wiska/.gemini/antigravity-cli/brain/a9ec66d2-60b3-46b7-998c-2fae2d5480e4/scratch/kandidat_22.json', JSON.stringify(kandidat22, null, 2));
  fs.writeFileSync('C:/Users/wiska/.gemini/antigravity-cli/brain/a9ec66d2-60b3-46b7-998c-2fae2d5480e4/scratch/pemakaian_nol_9.json', JSON.stringify(pemakaianNolAnomali, null, 2));

  process.exit(0);
}

main().catch(console.error);
