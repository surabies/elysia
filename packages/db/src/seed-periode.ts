import { db, periodePenagihan, caterMandiriPelanggan } from '@cater/db';
import { eq } from 'drizzle-orm';

async function seedPeriode() {
  console.log('Seeding periode_penagihan...');

  const periodes = [
    {
      periode: '202610',
      status: 'TERKUNCI',
      jumlahSl: 22524,
      totalM3: '450890.00',
      totalTagihan: '1849100000.00',
      tanggalJatuhTempo: new Date('2026-10-20T00:00:00.000Z'),
      ditutupAt: new Date('2026-10-25T17:00:00.000Z'),
    },
    {
      periode: '202611',
      status: 'BERJALAN',
      jumlahSl: 22524,
      totalM3: '452100.00',
      totalTagihan: '1855000000.00',
      tanggalJatuhTempo: new Date('2026-11-20T00:00:00.000Z'),
    },
  ];

  for (const item of periodes) {
    await db
      .insert(periodePenagihan)
      .values(item)
      .onConflictDoUpdate({
        target: periodePenagihan.periode,
        set: {
          status: item.status,
          jumlahSl: item.jumlahSl,
          totalM3: item.totalM3,
          totalTagihan: item.totalTagihan,
          tanggalJatuhTempo: item.tanggalJatuhTempo,
          ditutupAt: item.ditutupAt,
          updatedAt: new Date(),
        },
      });
  }

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
