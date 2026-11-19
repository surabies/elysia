import fs from 'fs';
import path from 'path';
import { db, conn } from '../../client';
import { areaLayanan, places, pelanggan } from '../../schema';
import type { SeedModule, SeedOptions } from '../types';

function normalizeName(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function seedWilayahAndGis(options?: { verbose?: boolean }) {
  const dataDir = path.resolve(__dirname, '../../../data');
  const areaLayananPath = path.resolve(dataDir, 'Area_layanan.geojson');
  const kecamatanDllPath = path.resolve(dataDir, 'Kacamatan DLL.geojson');
  const verifikasiPath = path.resolve(dataDir, 'Data_verifikasi.geojson');

  let areaCount = 0;

  // 1. Ingest & Merge 21 Kelurahan Area Layanan
  if (fs.existsSync(areaLayananPath) || fs.existsSync(kecamatanDllPath)) {
    const areaLayananFeatures = fs.existsSync(areaLayananPath)
      ? JSON.parse(fs.readFileSync(areaLayananPath, 'utf8')).features || []
      : [];
    const kecamatanDllFeatures = fs.existsSync(kecamatanDllPath)
      ? JSON.parse(fs.readFileSync(kecamatanDllPath, 'utf8')).features || []
      : [];

    // Index by normalized kelurahan name
    const dllMap = new Map<string, any>();
    for (const f of kecamatanDllFeatures) {
      const kel = f.properties?.DESA_KELUR || f.properties?.DESA || '';
      if (kel) {
        dllMap.set(normalizeName(kel), f);
      }
    }

    const mergedList: any[] = [];
    const seenCodes = new Set<string>();

    for (const f of areaLayananFeatures) {
      const rawKel = f.properties?.DESA_KELUR || f.properties?.DESA || '';
      const rawKec = f.properties?.KECAMATAN || '';
      const kodeDesa = f.properties?.KODE_DESA?.trim();
      if (!kodeDesa || seenCodes.has(kodeDesa)) continue;
      seenCodes.add(kodeDesa);

      const norm = normalizeName(rawKel);
      const dllFeature = dllMap.get(norm);
      const dllProps = dllFeature?.properties || {};

      const geom = f.geometry?.coordinates?.length > 0 ? f.geometry : dllFeature?.geometry;

      mergedList.push({
        kodeDesa,
        kelurahan: rawKel,
        kecamatan: rawKec || dllProps.KECAMATAN || 'BANDUNG',
        geometry: geom || null,
        wilayah: dllProps.WILAYAH || 'PELAYANAN WILAYAH 5',
        zona: dllProps.ZONA || null,
        jumlahKk: dllProps['JUMLAH KK'] ? Math.round(Number(dllProps['JUMLAH KK'])) : null,
        pelanggan: dllProps.PELANGGAN || null,
        topografi: dllProps.TOPOGRAFI || null,
        potensi: dllProps.POTENSI || null,
        bangunan: dllProps.BANGUNAN || null,
        sumberAir: dllProps['SUMBER AIR'] || null,
        durasi: dllProps.DURASI || null,
        luasArea: dllProps['LUAS AREA'] || null,
        latitude: dllProps.LATITUDE ? Number(dllProps.LATITUDE) : null,
        longitude: dllProps.LONGTITUDE ? Number(dllProps.LONGTITUDE) : null,
      });
    }

    // Upsert into area_layanan
    for (const item of mergedList) {
      await db
        .insert(areaLayanan)
        .values(item)
        .onConflictDoUpdate({
          target: areaLayanan.kodeDesa,
          set: {
            kelurahan: item.kelurahan,
            kecamatan: item.kecamatan,
            geometry: item.geometry,
            wilayah: item.wilayah,
            zona: item.zona,
            jumlahKk: item.jumlahKk,
            pelanggan: item.pelanggan,
            topografi: item.topografi,
            sumberAir: item.sumberAir,
            durasi: item.durasi,
            luasArea: item.luasArea,
            updatedAt: new Date(),
          },
        });
      areaCount++;
    }
  }

  // 2. Ingest Bandung PDAM Landmark Places
  const defaultUserId = 'seed-user-1';
  const landmarkPlaces = [
    {
      id: 'place-pdam-pusat',
      name: 'Kantor Pusat Perumda Tirtawening',
      description: 'Kantor Pusat PDAM Kota Bandung (Jl. Badak Singa No. 10)',
      location: { x: 107.611842, y: -6.897351 },
      userId: defaultUserId,
    },
    {
      id: 'place-cabang-pw5',
      name: 'Kantor Pelayanan Wilayah 5',
      description: 'Kantor Operasional & Verifikasi Pelayanan Wilayah 5',
      location: { x: 107.614521, y: -6.938514 },
      userId: defaultUserId,
    },
    {
      id: 'place-alun-alun',
      name: 'Alun-Alun Kota Bandung',
      description: 'Pusat Kota Bandung & Landmark Pelayanan Wilayah Regol',
      location: { x: 107.609811, y: -6.921822 },
      userId: defaultUserId,
    },
    {
      id: 'place-gedung-sate',
      name: 'Gedung Sate Bandung',
      description: 'Landmark Ikonik Ibukota Jawa Barat',
      location: { x: 107.618641, y: -6.902511 },
      userId: defaultUserId,
    },
  ];

  for (const p of landmarkPlaces) {
    await db.insert(places).values(p).onConflictDoNothing();
  }

  // 3. Batch Update High-Precision GPS Coordinates from mWater Survey
  let updatedCoords = 0;
  if (fs.existsSync(verifikasiPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(verifikasiPath, 'utf8'));
      const features = raw.features || [];
      const updates: Array<{ nolg: string; lng: number; lat: number }> = [];

      for (const f of features) {
        const status = f.properties?.['Status Kepelangganan'];
        const nolg = f.properties?.['Nomor Pelanggan'];
        const coords = f.geometry?.coordinates;
        if (status === 'Pelanggan' && nolg && Array.isArray(coords) && coords.length >= 2) {
          const [lng, lat] = coords;
          if (typeof lng === 'number' && typeof lat === 'number') {
            updates.push({ nolg: String(nolg).trim(), lng, lat });
          }
        }
      }

      // Execute high-speed batch SQL updates
      const batchSize = 250;
      for (let i = 0; i < updates.length; i += batchSize) {
        const chunk = updates.slice(i, i + batchSize);
        const valuesSql = chunk
          .map((c) => `('${c.nolg.replace(/'/g, "''")}', ${c.lng}, ${c.lat})`)
          .join(', ');

        const sqlQuery = `
          UPDATE pelanggan AS p
          SET titik_lokasi = ST_SetSRID(ST_Point(v.lng, v.lat), 4326),
              updated_at = NOW()
          FROM (VALUES ${valuesSql}) AS v(nolg, lng, lat)
          WHERE p.nolg = v.nolg
        `;

        const res = await conn.unsafe(sqlQuery);
        updatedCoords += res.count || 0;
      }
    } catch (e) {
      if (options?.verbose) console.warn('Could not update mWater coordinates:', e);
    }
  }

  return {
    count: areaCount,
    message: `Seeded ${areaCount} area layanan & ${landmarkPlaces.length} landmark. ${
      updatedCoords > 0 ? `Sinkronisasi GPS mWater: ${updatedCoords} pelanggan.` : ''
    }`,
  };
}

export const wilayahGisModule: SeedModule = {
  id: 'wilayah-gis',
  name: 'Wilayah Layanan & Geospasial',
  description: '21 Kelurahan Area Layanan PW5 (Metadata KK, Zona, Sumber Air), Landmark Kota, & mWater Survey',
  run: async (options: SeedOptions) => {
    return await seedWilayahAndGis({ verbose: options.verbose });
  },
};
