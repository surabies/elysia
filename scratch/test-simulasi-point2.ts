import { db } from '@cater/db';
import { sql } from 'drizzle-orm';
import { aturanAnomaliService } from '../apps/web/src/server/services/cater/aturan-anomali.service';

async function main() {
  console.log('=== TEST SIMULASI DRY-RUN ANOM_LONJAKAN_M3 (minM3: 50) ===');

  // Case A: Hanya minM3: 50
  const resA = await aturanAnomaliService.pratinjauDampak('aturan-lonjakan-m3', {
    minM3: 50
  });

  console.log('Case A (hanya minM3: 50):');
  console.log('Total baris:', resA.totalBaris);
  console.log('Sebelum:', resA.sebelum);
  console.log('Sesudah:', resA.sesudah);
  console.log('Perubahan netto:', resA.perubahanNetto);
  console.log('Jumlah baris berubah:', resA.jumlahBarisBerubah);
  console.log('Rincian per kode:');
  console.table(resA.rincianPerKode.filter(r => r.selisih !== 0));

  // Case B: minM3: 50 dan acuanPembanding: 'RATA_HISTORIS'
  const resB = await aturanAnomaliService.pratinjauDampak('aturan-lonjakan-m3', {
    minM3: 50,
    acuanPembanding: 'RATA_HISTORIS'
  });
  console.log('\nCase B (minM3: 50 + acuanPembanding RATA_HISTORIS):');
  console.log('Perubahan netto:', resB.perubahanNetto);
  console.log('Jumlah baris berubah:', resB.jumlahBarisBerubah);
}

main().catch(console.error);
