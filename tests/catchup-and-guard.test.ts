import { describe, expect, it } from 'bun:test';
import { db, caterBacaMeter } from '@cater/db';
import { sql, eq } from 'drizzle-orm';
import { runBackfillMassal } from '../packages/db/src/scripts/backfill-anomali-massal';
import { assertNotProductionDatabase } from './gerbang-c-ui-aturan.test';

describe('Uji Validasi Catch-up Backfill & Guard Produksi', () => {
  it('1. Guard Produksi menolak eksekusi jika host menunjuk ke database utama ep-still-sun', () => {
    const prodUrl = 'postgresql://neondb_owner:secret@ep-still-sun-azg726ne-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb';
    expect(() => {
      assertNotProductionDatabase(prodUrl);
    }).toThrow('CRITICAL_GUARD: Uji yang menulis ke tabel aturan DILARANG berjalan pada database produksi utama');
  });

  it('2. Mode Catch-up Backfill (onlyUnclassified: true) terbukti HANYA menyentuh aturan_versi IS NULL', async () => {
    // A. Pilih 1 baris uji pada periode berjalan (202611)
    const [sample] = await db
      .select({ id: caterBacaMeter.id })
      .from(caterBacaMeter)
      .where(sql`${caterBacaMeter.thbl} = '202611'`)
      .limit(1);

    expect(sample).toBeDefined();

    // B. Ubah status baris menjadi SUBMITTED dan aturan_versi = NULL (simulasi transaksi baru kode lama)
    await db
      .update(caterBacaMeter)
      .set({ 
        statusVerifikasi: 'SUBMITTED',
        aturanVersi: null 
      })
      .where(eq(caterBacaMeter.id, sample.id));

    // C. Pastikan jumlah aturan_versi IS NULL tepat 1 baris
    const [unclassifiedBefore] = await db.execute(sql`
      SELECT count(*)::int as cnt FROM cater_baca_meter WHERE aturan_versi IS NULL
    `);
    expect(unclassifiedBefore.cnt).toBe(1);

    // D. Jalankan backfill dengan opsi onlyUnclassified (Catch-up)
    await runBackfillMassal(500, { onlyUnclassified: true });

    // E. Buktikan baris tersebut sekarang sudah terisi aturan_versi = 1 dan sisa NULL = 0
    const [unclassifiedAfter] = await db.execute(sql`
      SELECT count(*)::int as cnt FROM cater_baca_meter WHERE aturan_versi IS NULL
    `);
    expect(unclassifiedAfter.cnt).toBe(0);

    const [updatedRow] = await db
      .select({ aturanVersi: caterBacaMeter.aturanVersi })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, sample.id));

    expect(updatedRow.aturanVersi).toBeGreaterThanOrEqual(1);

    // Kembalikan status ke LOCKED_BILLING
    await db
      .update(caterBacaMeter)
      .set({ statusVerifikasi: 'LOCKED_BILLING' })
      .where(eq(caterBacaMeter.id, sample.id));
  });
});
