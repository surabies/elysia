import postgres from 'postgres';
import { evaluasiAnomaliBaris, type RuleDefinition, type KondisiMapItem, type ReadingInput } from '../apps/web/src/server/domain/cater/anomali-evaluator';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

// Formula legacy dry-run engine (cater-anomali.engine.ts sebelum SSOT)
function evaluateLegacy(stml: number, stma: number, pakaiM3: number, pakaiLalu: number | null, tmss: string) {
  const pakai = pakaiM3;
  const lalu = pakaiLalu;

  if (stma < stml) {
    return 'ANOM_METER_MUNDUR';
  }

  // TMSS Fisik / Kerusakan
  const tmssClean = tmss ? tmss.trim() : '';
  const kerusakanTmss = ['3', '6', '7', '9', 'D', 'F', 'O', 'T'];
  if (kerusakanTmss.includes(tmssClean)) {
    return 'ANOM_KERUSAKAN_METER';
  }

  // TMSS Kendala Akses
  const aksesTmss = ['2', '5', '8', 'AA', 'E', 'N', 'Q', 'R'];
  if (aksesTmss.includes(tmssClean)) {
    // Pada dry-run awal sebelum revisi, TMSS 8 dengan pakai 0 m3 dianggap ANOM_PEMAKAIAN_NOL
    if (tmssClean === '8' && pakai === 0) {
      return 'ANOM_PEMAKAIAN_NOL';
    }
    return 'WARN_KENDALA_AKSES';
  }

  // Lonjakan absolut
  if (lalu !== null && lalu > 0) {
    const selisih = pakai - lalu;
    const deviasi = ((pakai - lalu) / lalu) * 100;

    if (selisih > 75) {
      return 'ANOM_LONJAKAN_M3';
    }
    if (deviasi >= 100 && selisih >= 30) {
      return 'ANOM_LONJAKAN_PERSEN';
    }
    // Deviasi Ring TANPA syarat pakai lalu min 5 m3 (Legacy Engine)
    if (Math.abs(deviasi) > 80) {
      return 'ANOM_DEVIASI_RING3';
    }
    if (Math.abs(deviasi) >= 50) {
      if (deviasi <= -50 && lalu >= 10) {
        return 'ANOM_PENURUNAN_PERSEN';
      }
      return 'ANOM_DEVIASI_RING2';
    }
    if (Math.abs(deviasi) >= 30) {
      return 'WARN_DEVIASI_RING1';
    }
  }

  if (stma === stml && (lalu === null || lalu >= 10)) {
    return 'ANOM_PEMAKAIAN_NOL';
  }

  return 'NORMAL_BERSIH';
}

async function main() {
  console.log('=== HASIL QUERY LANGSUNG: KODE ANOMALI UTAMA PERIODE 202611 ===');
  const counts = await sql`
    SELECT 
      COALESCE(kode_anomali_utama, 'NORMAL_BERSIH') AS kode_anomali_utama,
      is_anomali,
      COUNT(*)::int AS jumlah_baris
    FROM cater_baca_meter
    WHERE thbl = '202611'
    GROUP BY kode_anomali_utama, is_anomali
    ORDER BY jumlah_baris DESC
  `;
  console.table(counts);

  // Ambil aturan & map SSOT dari DB
  const aturanList = await sql`SELECT * FROM aturan_anomali WHERE aktif = true ORDER BY urutan ASC`;
  const mapList = await sql`SELECT * FROM aturan_kondisi_meter_map WHERE aktif = true`;

  const rows = await sql`
    SELECT 
      c.id, c.thbl, c.nolg, c.stml, c.stma, c.pakai_m3, c.pakai_lalu, c.tmss,
      c.kode_anomali_utama AS ssot_kode, c.is_anomali AS ssot_anomali
    FROM cater_baca_meter c
    WHERE c.thbl = '202611'
    ORDER BY c.nolg ASC
  `;

  const shiftedRows: any[] = [];

  for (const r of rows) {
    const stml = Number(r.stml);
    const stma = Number(r.stma);
    const pakai = Number(r.pakai_m3);
    const lalu = r.pakai_lalu !== null ? Number(r.pakai_lalu) : null;
    const legacyKode = evaluateLegacy(stml, stma, pakai, lalu, r.tmss);

    // Filter: yang di legacy adalah RING3 atau RING2, tetapi di SSOT berbeda!
    if (legacyKode === 'ANOM_DEVIASI_RING3' || legacyKode === 'ANOM_DEVIASI_RING2') {
      if (r.ssot_kode !== legacyKode) {
        shiftedRows.push({
          nolg: r.nolg,
          stml,
          stma,
          pakai,
          lalu,
          deviasi: lalu && lalu > 0 ? `${(((pakai - lalu) / lalu) * 100).toFixed(1)}%` : '-',
          tmss: r.tmss || '-',
          legacyKode,
          ssotKode: r.ssot_kode || 'NORMAL_BERSIH',
          status: r.ssot_anomali ? 'TETAP_ANOMALI' : 'MENJADI_NORMAL'
        });
      }
    }
  }

  console.log(`\n=== DAFTAR BARIS YANG KODE UTAMANYA DI LEGACY ADALAH RING3/RING2 TETAPI BERPINDAH DI SSOT (Total: ${shiftedRows.length} baris) ===`);
  const becameNormal = shiftedRows.filter(r => r.status === 'MENJADI_NORMAL');
  console.log(`-> Berpindah menjadi NORMAL: ${becameNormal.length} baris`);
  console.table(becameNormal);

  const shiftedToOtherAnom = shiftedRows.filter(r => r.status === 'TETAP_ANOMALI');
  console.log(`-> Tetap Anomali tapi berpindah kode: ${shiftedToOtherAnom.length} baris`);
  console.table(shiftedToOtherAnom.slice(0, 15)); // print sample 15 baris

  await sql.end();
}

main().catch(console.error);
