import { db } from '@cater/db';
import { sql, eq } from 'drizzle-orm';
import { evaluasiAnomaliBaris, type ReadingInput } from '../apps/web/src/server/domain/cater/anomali-evaluator';
import { aturanAnomali, aturanKondisiMeterMap, aturanAnomaliVersi } from '@cater/db';

async function main() {
  const rules = await db.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
  const maps = await db
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
  const versi = Number(latestVersi?.versi || 1);

  // Simulated rules with minM3 = 50 on aturan-lonjakan-m3
  const simulatedRules = rules.map(r => {
    if (r.id === 'aturan-lonjakan-m3' || r.kode === 'ANOM_LONJAKAN_M3') {
      return { ...r, minM3: '50' };
    }
    return r;
  });

  // Query with LEFT JOIN prev
  const rows = await db.execute(sql`
    SELECT 
      c.id, c.thbl, c.nolg, c.tmss, c.stml, c.stma, c.pakai_m3, c.pakai_lalu,
      c.is_anomali, c.kode_anomali_utama,
      prev.tmss as prev_tmss,
      prev.pakai_m3 as prev_pakai_m3
    FROM cater_baca_meter c
    LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
      AND prev.thbl = to_char(to_date(c.thbl, 'YYYYMM') - interval '1 month', 'YYYYMM')
    WHERE c.thbl = '202611'
    ORDER BY c.nolg ASC
  `);

  const distSebelum: Record<string, number> = {};
  const distSesudah: Record<string, number> = {};
  let sebelumAnomali = 0;
  let sesudahAnomali = 0;
  let jumlahBarisBerubah = 0;

  // Track transitions: dari -> ke
  const transitions: Record<string, number> = {};

  for (const r of rows as any[]) {
    const kSebelum = r.kode_anomali_utama || 'NORMAL_BERSIH';
    distSebelum[kSebelum] = (distSebelum[kSebelum] || 0) + 1;
    if (r.is_anomali) sebelumAnomali++;

    const input: ReadingInput = {
      stml: Number(r.stml),
      stma: Number(r.stma),
      pakaiM3: Number(r.pakai_m3),
      pakaiLalu: r.pakai_lalu !== null ? Number(r.pakai_lalu) : null,
      kodeTmss: r.tmss,
      prevKondisiTmss: r.prev_tmss,
      prevPakaiM3: r.prev_pakai_m3 !== null ? Number(r.prev_pakai_m3) : null,
    };

    const res = evaluasiAnomaliBaris(input, simulatedRules as any, maps as any, versi);
    const kSesudah = res.kodeUtama || 'NORMAL_BERSIH';
    distSesudah[kSesudah] = (distSesudah[kSesudah] || 0) + 1;
    if (res.isAnomali) sesudahAnomali++;

    if (r.is_anomali !== res.isAnomali || r.kode_anomali_utama !== res.kodeUtama) {
      jumlahBarisBerubah++;
      const tKey = `${kSebelum} -> ${kSesudah}`;
      transitions[tKey] = (transitions[tKey] || 0) + 1;
    }
  }

  console.log('=== DRY RUN DENGAN PREV LENGKAP ===');
  console.log(`Sebelum: anomali ${sebelumAnomali}`);
  console.log(`Sesudah: anomali ${sesudahAnomali} (selisih: ${sesudahAnomali - sebelumAnomali})`);
  console.log(`Jumlah baris berubah: ${jumlahBarisBerubah}`);
  console.log('\nPerpindahan Kategori (Transitions):');
  console.table(transitions);

  const allKeys = Array.from(new Set([...Object.keys(distSebelum), ...Object.keys(distSesudah)])).sort();
  console.log('\nPerubahan per kode:');
  console.table(allKeys.map(k => ({
    kode: k,
    sebelum: distSebelum[k] || 0,
    sesudah: distSesudah[k] || 0,
    selisih: (distSesudah[k] || 0) - (distSebelum[k] || 0)
  })).filter(x => x.selisih !== 0));
}

main().catch(console.error);
