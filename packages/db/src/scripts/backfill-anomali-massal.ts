// packages/db/src/scripts/backfill-anomali-massal.ts
// Skrip Standalone Backfill Evaluasi Anomali Massal SSOT untuk Migrasi Produksi / Latihan
import { db } from '../client';
import {
  aturanAnomali,
  aturanKondisiMeterMap,
  aturanAnomaliVersi,
} from '../schema';
import { sql, eq } from 'drizzle-orm';
import {
  evaluasiAnomaliBaris,
  type ReadingInput,
} from '../../../backend/src/domain/cater/anomali-evaluator';

export async function runBackfillMassal(
  batchSize: number = 2000,
  options: { dryRun?: boolean; confirmDb?: string; onlyUnclassified?: boolean } = {}
) {
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':***@');
  const isProductionTarget = dbUrl.includes('ep-still-sun');
  const isDryRun = options.dryRun || process.argv.includes('--dry-run');
  const isCatchup =
    options.onlyUnclassified ||
    process.argv.includes('--catchup') ||
    process.argv.includes('--only-unclassified');

  console.log('====================================================');
  console.log(`   SKRIP BACKFILL ANOMALI MASSAL (SSOT ENGINE)      `);
  if (isDryRun) {
    console.log(`   [MODE SIMULASI / DRY-RUN: TIDAK MENULIS KE DB]   `);
  }
  if (isCatchup) {
    console.log(`   [MODE CATCH-UP: HANYA MENYENTUH aturan_versi IS NULL]`);
    console.log(`   [PERLINDUNGAN: MENGABAIKAN BARIS PERIODE TERKUNCI]   `);
  }
  console.log('====================================================');
  console.log(`DATABASE_URL Target: ${maskedUrl}`);

  // Safety Guard Lapis Ganda untuk Database Produksi Utama
  if (isProductionTarget) {
    const isAllowProd = process.env.ALLOW_PRODUCTION_RUN === 'true';
    const confirmName = options.confirmDb || process.env.CONFIRM_DB_NAME || '';
    const argConfirm = process.argv.find((a) => a.startsWith('--confirm='));
    const confirmVal = argConfirm ? argConfirm.split('=')[1] : confirmName;

    if (!isAllowProd || confirmVal !== 'ep-still-sun-azg726ne') {
      console.error('\n[BLOCKED] PENCEGAHAN EKSEKUSI TIDAK SENGAJA KE DATABASE UTAMA:');
      console.error('- Database target terdeteksi adalah DATABASE PRODUKSI UTAMA (ep-still-sun).');
      console.error('- Untuk mengeksekusi dengan sengaja, Anda WAJIB menyertakan:');
      console.error('  1. Environment variable: ALLOW_PRODUCTION_RUN=true');
      console.error('  2. Argumen konfirmasi nama database: --confirm=ep-still-sun-azg726ne');
      throw new Error('Eksekusi dibatalkan demi keamanan data produksi.');
    }
    console.log('[PERINGATAN RESMI] Eksekusi disetujui pada DATABASE PRODUKSI UTAMA.');
  }

  const startTime = Date.now();

  // 1. Ambil konteks aturan aktif dan mapping kondisi
  console.log('[1/4] Mengambil definisi aturan & kondisi mapping SSOT...');
  const rulesDb = await db.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
  const mapDb = await db
    .select({
      kodeTmss: aturanKondisiMeterMap.kodeTmss,
      aturanAnomaliId: aturanKondisiMeterMap.aturanAnomaliId,
      aturanKode: aturanAnomali.kode,
      isBaselineNormal: aturanKondisiMeterMap.isBaselineNormal,
      isPeriodeTidakAktif: aturanKondisiMeterMap.isPeriodeTidakAktif,
      aktif: aturanKondisiMeterMap.aktif,
    })
    .from(aturanKondisiMeterMap)
    .innerJoin(aturanAnomali, eq(aturanKondisiMeterMap.aturanAnomaliId, aturanAnomali.id))
    .where(eq(aturanKondisiMeterMap.aktif, true));

  const [latestVersi] = await db
    .select({ versi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 1)` })
    .from(aturanAnomaliVersi);
  const activeVersi = Number(latestVersi?.versi || 1);

  console.log(`-> Ditemukan ${rulesDb.length} aturan, ${mapDb.length} pemetaan kondisi, versi aktif: v${activeVersi}`);

  // 2. Query baris cater_baca_meter dengan left join ke periode sebelumnya (N-1)
  console.log('[2/4] Mengambil baris cater_baca_meter beserta data historis N-1...');
  const fetchStart = Date.now();
  const whereClause = isCatchup
    ? sql`WHERE c.aturan_versi IS NULL 
            AND c.status_verifikasi != 'LOCKED_BILLING' 
            AND c.thbl NOT IN (SELECT periode FROM periode_penagihan WHERE status = 'TERKUNCI')`
    : sql``;

  const rows = await db.execute(sql`
    SELECT 
      c.id,
      c.thbl,
      c.nolg,
      c.tmss,
      c.stml,
      c.stma,
      c.pakai_m3,
      c.pakai_lalu,
      prev.tmss as prev_tmss,
      prev.pakai_m3 as prev_pakai_m3
    FROM cater_baca_meter c
    LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
      AND prev.thbl = to_char(to_date(c.thbl, 'YYYYMM') - interval '1 month', 'YYYYMM')
    ${whereClause}
    ORDER BY c.thbl ASC, c.nolg ASC
  `);
  console.log(`-> Berhasil mengambil ${rows.length} baris dalam ${Date.now() - fetchStart} ms`);

  // 3. Evaluasi anomali in-memory secara berurutan
  console.log('[3/4] Menjalankan evaluasi in-memory dengan SSOT evaluator...');
  const evalStart = Date.now();
  const updates: Array<{
    id: string;
    is_anomali: boolean;
    kode_anomali_utama: string | null;
    kode_anomali_list: string[];
    aturan_versi: number;
  }> = [];

  for (const r of rows as any[]) {
    const input: ReadingInput = {
      stml: Number(r.stml),
      stma: Number(r.stma),
      pakaiM3: Number(r.pakai_m3),
      pakaiLalu: r.pakai_lalu !== null ? Number(r.pakai_lalu) : null,
      kodeTmss: r.tmss,
      prevKondisiTmss: r.prev_tmss,
      prevPakaiM3: r.prev_pakai_m3 !== null ? Number(r.prev_pakai_m3) : null,
    };

    const res = evaluasiAnomaliBaris(input, rulesDb as any, mapDb as any, activeVersi);
    updates.push({
      id: r.id,
      is_anomali: res.isAnomali,
      kode_anomali_utama: res.kodeUtama,
      kode_anomali_list: res.kodeList,
      aturan_versi: activeVersi,
    });
  }
  console.log(`-> Evaluasi in-memory 100% selesai dalam ${Date.now() - evalStart} ms`);

  // 4. Update massal ke database dalam batch
  if (isDryRun) {
    console.log('[4/4] [DRY-RUN] Melewati penulisan UPDATE ke database (Hanya menghitung statistik).');
    const anomaliCount = updates.filter((u) => u.is_anomali).length;
    const warnCount = updates.filter((u) => !u.is_anomali && u.kode_anomali_utama?.startsWith('WARN_')).length;
    const normalCount = updates.filter((u) => !u.is_anomali && !u.kode_anomali_utama).length;

    console.log(`   -> Simulasi Hasil: ${anomaliCount} Anomali, ${warnCount} Peringatan, ${normalCount} Normal.`);
  } else {
    console.log(`[4/4] Menjalankan batch UPDATE ke database (Ukuran batch: ${batchSize} baris)...`);
    const updateStart = Date.now();
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const chunk = updates.slice(i, i + batchSize);
      const valuesSql = chunk
        .map(
          (u) =>
            `('${u.id}'::text, ${u.is_anomali}::boolean, ${
              u.kode_anomali_utama ? `'${u.kode_anomali_utama}'` : 'NULL'
            }::varchar, ARRAY[${u.kode_anomali_list
              .map((k) => `'${k}'`)
              .join(',')}]::text[], ${u.aturan_versi}::integer)`
        )
        .join(',\n');

      await db.execute(sql.raw(`
        UPDATE cater_baca_meter AS c
        SET 
          is_anomali = v.is_anomali,
          kode_anomali_utama = v.kode_anomali_utama,
          kode_anomali_list = v.kode_anomali_list,
          aturan_versi = v.aturan_versi
        FROM (VALUES ${valuesSql}) AS v(id, is_anomali, kode_anomali_utama, kode_anomali_list, aturan_versi)
        WHERE c.id = v.id;
      `));

      totalUpdated += chunk.length;
      process.stdout.write(`   Telah di-update: ${totalUpdated}/${updates.length} baris...\r`);
    }
    console.log(`\n-> Batch UPDATE selesai dalam ${Date.now() - updateStart} ms`);
  }

  const totalDuration = Date.now() - startTime;
  console.log('====================================================');
  console.log(`BACKFILL SELESAI SUKSES!`);
  console.log(`Total Baris Diproses: ${updates.length}`);
  console.log(`Ukuran Batch        : ${batchSize}`);
  console.log(`Total Durasi        : ${totalDuration} ms (${(totalDuration / 1000).toFixed(2)} detik)`);
  console.log('====================================================');

  return {
    totalRows: updates.length,
    batchSize,
    durationMs: totalDuration,
  };
}

if (import.meta.main) {
  runBackfillMassal()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Backfill Error:', err);
      process.exit(1);
    });
}
