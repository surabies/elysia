import fs from 'fs';
import path from 'path';
import { db } from './client';
import { pelanggan, areaLayanan, kelurahan, kecamatan } from './schema';
import { eq, sql } from 'drizzle-orm';

export async function seedDataVerifikasi() {
  console.log('=== SEEDING DATA VERIFIKASI SPASIAL (mWater) ===');
  const geojsonPath = path.resolve(__dirname, '../data/Data_verifikasi.geojson');
  if (!fs.existsSync(geojsonPath)) {
    console.warn('Data_verifikasi.geojson not found at:', geojsonPath);
    return;
  }

  const raw = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
  console.log(`Loaded ${raw.features.length} survey features from Data_verifikasi.geojson`);

  let updatedPelanggan = 0;
  for (const f of raw.features) {
    const status = f.properties['Status Kepelangganan'];
    const nolg = f.properties['Nomor Pelanggan'];
    const geom = f.geometry;

    if (status === 'Pelanggan' && nolg && geom?.coordinates) {
      const [lng, lat] = geom.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number') {
        try {
          await db
            .update(pelanggan)
            .set({
              titikLokasi: { x: lng, y: lat },
              updatedAt: new Date(),
            })
            .where(eq(pelanggan.nolg, nolg));
          updatedPelanggan++;
        } catch (e) {
          // ignore individual update errors
        }
      }
    }
  }

  console.log(`Updated ${updatedPelanggan} pelanggan coordinates from high-precision survey!`);
}

export async function syncAreaLayanan21Kelurahan() {
  console.log('=== SYNC AREA LAYANAN (7 KECAMATAN, 21 KELURAHAN) ===');
  const areaPath = path.resolve(__dirname, '../data/Area_layanan.geojson');
  if (!fs.existsSync(areaPath)) return;

  const raw = JSON.parse(fs.readFileSync(areaPath, 'utf-8'));
  const kels = await db.select().from(kelurahan);
  const kecs = await db.select().from(kecamatan);
  const kecMap = new Map(kecs.map(k => [k.kode, k.nama]));

  const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const geoMap = new Map<string, any>();
  for (const f of raw.features) {
    const desa = f.properties?.DESA_KELUR || f.properties?.DESA || '';
    geoMap.set(normalize(desa), f);
  }

  // Bersihkan dan masukkan hanya 21 kelurahan yang valid
  await db.delete(areaLayanan);

  let inserted = 0;
  for (const k of kels) {
    const n = normalize(k.nama);
    const feat = geoMap.get(n);
    if (feat && feat.geometry) {
      const namaKec = kecMap.get(k.kecamatanKode) || 'BANDUNG';
      await db.insert(areaLayanan).values({
        kodeDesa: k.kode,
        kelurahan: k.nama,
        kecamatan: namaKec,
        geometry: feat.geometry,
      });
      inserted++;
    }
  }

  console.log(`Synced ${inserted} of 21 official kelurahan into area_layanan!`);
}

async function main() {
  await syncAreaLayanan21Kelurahan();
  await seedDataVerifikasi();
  console.log('=== SEED COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

if (import.meta.main) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
