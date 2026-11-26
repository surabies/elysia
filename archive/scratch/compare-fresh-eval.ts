import { db } from '@cater/db';
import { sql, eq } from 'drizzle-orm';
import { evaluasiAnomaliBaris, type ReadingInput } from '../apps/web/src/server/domain/cater/anomali-evaluator';
import { aturanAnomali, aturanKondisiMeterMap, aturanAnomaliVersi } from '@cater/db';

async function main() {
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
      c.is_anomali as current_is_anomali,
      c.kode_anomali_utama as current_kode,
      c.aturan_versi,
      prev.tmss as prev_tmss,
      prev.pakai_m3 as prev_pakai_m3
    FROM cater_baca_meter c
    LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
      AND prev.thbl = to_char(to_date(c.thbl, 'YYYYMM') - interval '1 month', 'YYYYMM')
    WHERE c.thbl = '202611'
    ORDER BY c.nolg ASC
  `);

  console.log(`Loaded ${rows.length} rows for 202611.`);

  const evalCounts: Record<string, number> = {};
  let evalAnomali = 0;
  let diffCount = 0;

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
    const k = res.kodeUtama || 'NORMAL';
    evalCounts[k] = (evalCounts[k] || 0) + 1;
    if (res.isAnomali) evalAnomali++;

    if (res.kodeUtama !== r.current_kode || res.isAnomali !== r.current_is_anomali) {
      diffCount++;
      if (diffCount <= 10) {
        console.log(`Diff: nolg ${r.nolg}, current: ${r.current_kode} (${r.current_is_anomali}), eval: ${res.kodeUtama} (${res.isAnomali})`);
      }
    }
  }

  console.log(`Total anomalies from fresh eval: ${evalAnomali}`);
  console.log(`Differences with current cater_baca_meter: ${diffCount}`);
  console.log('Fresh eval breakdown:');
  console.table(evalCounts);
}
main().catch(console.error);
