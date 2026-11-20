import { db, ruteCater, pelanggan, caterBacaMeter } from '@cater/db';
import { sql, eq, or, like } from 'drizzle-orm';

async function main() {
  const ruteKC = await db.select().from(ruteCater).where(or(like(ruteCater.kode, '%308%'), like(ruteCater.kode, '%KC%')));
  console.log('ruteCater matching 308 or KC:');
  console.table(ruteKC);

  const pelKC = await db.select({ nolg: pelanggan.nolg, nama: pelanggan.nama, ruteKode: pelanggan.ruteKode })
    .from(pelanggan).where(or(eq(pelanggan.ruteKode, 'KC308'), eq(pelanggan.ruteKode, 'KD308')));
  console.log(`Pelanggan with KC308 or KD308 count: ${pelKC.length}`);
  console.table(pelKC.slice(0, 5));

  const caterKC = await db.select({ thbl: caterBacaMeter.thbl, ruteKode: caterBacaMeter.ruteKode, petugasId: caterBacaMeter.petugasId, count: sql<number>`count(*)::int` })
    .from(caterBacaMeter).where(or(eq(caterBacaMeter.ruteKode, 'KC308'), eq(caterBacaMeter.ruteKode, 'KD308')))
    .groupBy(caterBacaMeter.thbl, caterBacaMeter.ruteKode, caterBacaMeter.petugasId);
  console.log('caterBacaMeter with KC308 or KD308:');
  console.table(caterKC);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
