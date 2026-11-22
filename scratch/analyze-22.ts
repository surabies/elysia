import postgres from 'postgres';
import fs from 'fs';

const url = process.env.DATABASE_URL || '';
const sql = postgres(url);

async function main() {
  const cols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'cater_baca_meter'
  `;
  console.log('cater_baca_meter columns:', cols.map(c => c.column_name));

  const rawKandidat = fs.readFileSync('C:/Users/wiska/.gemini/antigravity-cli/brain/a9ec66d2-60b3-46b7-998c-2fae2d5480e4/scratch/kandidat_22.json', 'utf8');
  const kandidat = JSON.parse(rawKandidat);
  console.log('Total items in kandidat_22.json:', kandidat.length);

  const ids = kandidat.map((k: any) => k.id);

  // Let's find what column holds the period (e.g. periode_tagihan or id_periode)
  const rows = await sql`
    SELECT *
    FROM cater_baca_meter 
    WHERE id = ANY(${ids})
  `;
  console.log('Found in cater_baca_meter by id:', rows.length);
  for (const r of rows) {
    const k = kandidat.find((x: any) => x.id === r.id);
    console.log(JSON.stringify({
      id: r.id,
      nolg: r.nolg,
      periode_id: r.id_periode || r.periode,
      stml: Number(r.stml),
      stma: Number(r.stma),
      pakai: Number(r.pakai_m3 ?? r.pemakaian),
      pakai_lalu: Number(r.pakai_lalu),
      deviasi_persen: k ? k.deviasi_persen : null,
      kondisi_meter: r.kondisi_meter,
      is_anomali: r.is_anomali,
      kode_anomali_utama: r.kode_anomali_utama,
      kode_anomali_list: r.kode_anomali_list
    }));
  }

  await sql.end();
}

main().catch(console.error);
