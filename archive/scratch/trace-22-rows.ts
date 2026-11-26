import postgres from 'postgres';
import fs from 'fs';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const rawKandidat = fs.readFileSync('C:/Users/wiska/.gemini/antigravity-cli/brain/a9ec66d2-60b3-46b7-998c-2fae2d5480e4/scratch/kandidat_22.json', 'utf8');
  const kandidat = JSON.parse(rawKandidat);

  const ids = kandidat.map((k: any) => k.id);

  const rows = await sql`
    SELECT id, nolg, stml, stma, pakai_m3, pakai_lalu, tmss,
           is_anomali, kode_anomali_utama, kode_anomali_list
    FROM cater_baca_meter
    WHERE thbl = '202611' AND id = ANY(${ids})
    ORDER BY nolg ASC
  `;

  console.log(`Found ${rows.length} rows in 202611:`);
  const details = rows.map(r => {
    const stml = Number(r.stml);
    const stma = Number(r.stma);
    const pakai = Number(r.pakai_m3);
    const lalu = Number(r.pakai_lalu);
    const selisih = pakai - lalu;
    const deviasi = lalu > 0 ? ((pakai - lalu) / lalu) * 100 : null;

    // What would legacy dry-run have assigned?
    let legacyKode = 'NORMAL';
    if (deviasi !== null) {
      if (Math.abs(deviasi) > 80) {
        legacyKode = 'ANOM_DEVIASI_RING3';
      } else if (Math.abs(deviasi) >= 50) {
        if (deviasi <= -50 && lalu >= 10) {
          legacyKode = 'ANOM_PENURUNAN_PERSEN';
        } else {
          legacyKode = 'ANOM_DEVIASI_RING2';
        }
      }
    }

    return {
      nolg: r.nolg,
      stml,
      stma,
      pakai,
      lalu,
      deviasi: deviasi !== null ? `${deviasi.toFixed(1)}%` : '-',
      tmss: r.tmss,
      legacyKode,
      ssotKode: r.kode_anomali_utama || 'NORMAL_BERSIH',
      ssotAnomali: r.is_anomali,
      ssotList: r.kode_anomali_list
    };
  });

  console.table(details);
  await sql.end();
}

main().catch(console.error);
