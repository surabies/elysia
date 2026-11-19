import { db, periodePenagihan, caterMandiriPelanggan } from '@cater/db';
import { eq } from 'drizzle-orm';

async function seedPeriode() {
  console.log('Seeding periode_penagihan...');
  await db
    .insert(periodePenagihan)
    .values([
      {
        periode: '202610',
        status: 'TERKUNCI',
        jumlahSl: 22524,
      },
      {
        periode: '202611',
        status: 'BERJALAN',
        jumlahSl: 22524,
      },
    ])
    .onConflictDoNothing();

  console.log('Sinkronisasi data mandiri yang sudah masuk...');
  // Update record mandiri yang sempat masuk dengan pakaiM3 = 2285
  await db
    .update(caterMandiriPelanggan)
    .set({
      thbl: '202611',
      // Jika stand akhir 2285 dan stand lalu estimasi 2260, pemakaian 25 m3
      pakaiM3: '25.00',
    })
    .where(eq(caterMandiriPelanggan.id, 'mandiri-202601-00407210361'));

  console.log('Sukses seed periode dan perbaikan mandiri!');
}

seedPeriode().catch(console.error).finally(() => process.exit(0));
