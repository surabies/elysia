// packages/db/src/scripts/find-differences.ts
import { db } from '../client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Menyelidiki selisih antara hasil evaluasi lama vs SSOT...');

  // Cari baris di 202611 di mana DEVIASI_RING3 di SSOT adalah 323 vs 349 lama (-26)
  // Apa penyebab DEVIASI_RING3 di SSOT:
  // Di SSOT:
  // deviasi > 80% DAN pakaiLalu >= 5 m³ DAN pakaiM3 > 0.
  // Bagaimana dengan engine lama?
  // Engine lama di verifikasi-grid atau cater-anomali.engine:
  // Apakah engine lama mengevaluasi deviasi ring 3 dengan syarat pakaiLalu >= 5 m³ atau tanpa syarat pakaiLalu >= 5?
  
  // Mari cek baris 202611 dengan deviasi > 80% tapi pakai_lalu < 5:
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

  console.log(`Baris di 202611 dengan deviasi > 80% tetapi pakai_lalu < 5 m³: ${ring3Kecil.length} baris!`);
  console.table(ring3Kecil.slice(0, 10));

  // Cek klasifikasi baris-baris ini di SSOT:
  const distRing3Kecil: Record<string, number> = {};
  for (const r of ring3Kecil as any[]) {
    const k = r.kode_anomali_utama || 'NORMAL_BERSIH';
    distRing3Kecil[k] = (distRing3Kecil[k] || 0) + 1;
  }
  console.log('Distribusi klasifikasi baris deviasi > 80% dengan pakai_lalu < 5 m³ di SSOT:', distRing3Kecil);

  process.exit(0);
}

main().catch(console.error);
