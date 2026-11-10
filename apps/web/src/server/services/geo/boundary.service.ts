import 'server-only';

import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db, areaLayanan, pelanggan } from '@cater/db';
import type { PetaCakupan } from '@/lib/domain/peta-tipe';

export interface GeoFeature {
  type: 'Feature';
  geometry: any;
  properties: Record<string, any>;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

function resolveGeoJsonPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'packages', 'db', 'data', 'Area_layanan.geojson'),
    path.join(process.cwd(), '..', '..', 'packages', 'db', 'data', 'Area_layanan.geojson'),
    path.join(process.cwd(), '..', 'packages', 'db', 'data', 'Area_layanan.geojson'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function batasKelurahanFC(): Promise<FeatureCollection | null> {
  try {
    const rows = await db.select().from(areaLayanan);
    if (rows && rows.length > 0) {
      return {
        type: 'FeatureCollection',
        features: rows
          .filter((r) => r.geometry)
          .map((r, idx) => ({
            type: 'Feature',
            geometry: r.geometry,
            properties: {
              id: r.kodeDesa,
              kode: r.kodeDesa,
              nama: r.kelurahan,
              kecamatan: r.kecamatan,
              warna: idx % 3,
            },
          })),
      };
    }
  } catch (err) {
    console.warn('[BATAS_KELURAHAN_DB_WARN]', err);
  }

  // Fallback to local Area_layanan.geojson
  try {
    const geoJsonPath = resolveGeoJsonPath();
    if (geoJsonPath) {
      const raw = fs.readFileSync(geoJsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.features)) {
        return {
          type: 'FeatureCollection',
          features: parsed.features.map((f: any, idx: number) => ({
            type: 'Feature',
            geometry: f.geometry,
            properties: {
              id: String(f.properties?.KODE_DESA || f.properties?.OBJECT_ID || idx),
              kode: String(f.properties?.KODE_DESA || ''),
              nama: String(f.properties?.DESA_KELUR || f.properties?.DESA || 'Kelurahan'),
              kecamatan: String(f.properties?.KECAMATAN || ''),
              warna: idx % 3,
            },
          })),
        };
      }
    }
  } catch (err) {
    console.warn('[BATAS_KELURAHAN_FILE_WARN]', err);
  }

  return null;
}

export async function batasKecamatanFC(): Promise<FeatureCollection | null> {
  const kelurahanFC = await batasKelurahanFC();
  if (!kelurahanFC || kelurahanFC.features.length === 0) return null;

  // Sederhanakan batas kecamatan dari fitur kelurahan yang memiliki kecamatan sama
  const kecMap = new Map<string, any[]>();
  for (const f of kelurahanFC.features) {
    const kec = f.properties.kecamatan;
    if (!kec) continue;
    const list = kecMap.get(kec) ?? [];
    list.push(f);
    kecMap.set(kec, list);
  }

  const features: GeoFeature[] = [];
  for (const [kec, feats] of kecMap.entries()) {
    // Gunakan representasi geometri kecamatan
    const firstGeom = feats[0]?.geometry;
    if (firstGeom) {
      features.push({
        type: 'Feature',
        geometry: firstGeom,
        properties: {
          id: `kec-${kec.toLowerCase().replace(/\s+/g, '-')}`,
          nama: kec,
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export async function titikPelangganFC(limit = 10000): Promise<FeatureCollection | null> {
  try {
    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        titikLokasi: pelanggan.titikLokasi,
      })
      .from(pelanggan)
      .where(sql`${pelanggan.titikLokasi} is not null`)
      .limit(limit);

    if (!rows || rows.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: rows.map((r) => {
        const geo = r.titikLokasi as { x: number; y: number };
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [geo.x, geo.y],
          },
          properties: {
            id: r.nolg,
            nama: r.nama,
          },
        };
      }),
    };
  } catch (err) {
    console.warn('[TITIK_PELANGGAN_WARN]', err);
    return null;
  }
}

const LEBAR = 800;
const TINGGI = 600;
const PADDING = 24;

type Cincin = [number, number][];

function cincinLuar(geom: any): Cincin[] {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates[0] as Cincin];
  if (geom.type === 'MultiPolygon')
    return geom.coordinates.map((poly: any) => poly[0] as Cincin);
  return [];
}

export async function getPetaCakupan(): Promise<PetaCakupan | null> {
  const kelFC = await batasKelurahanFC();
  if (!kelFC || kelFC.features.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const f of kelFC.features) {
    for (const cincin of cincinLuar(f.geometry)) {
      for (const [lng, lat] of cincin) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  const rentangLng = maxLng - minLng || 1;
  const rentangLat = maxLat - minLat || 1;
  const tersedia_w = LEBAR - PADDING * 2;
  const tersedia_h = TINGGI - PADDING * 2;
  const skala = Math.min(tersedia_w / rentangLng, tersedia_h / rentangLat);
  const offsetX = PADDING + (tersedia_w - rentangLng * skala) / 2;
  const offsetY = PADDING + (tersedia_h - rentangLat * skala) / 2;

  function proyeksi(lng: number, lat: number): [number, number] {
    const x = offsetX + (lng - minLng) * skala;
    const y = offsetY + (maxLat - lat) * skala;
    return [x, y];
  }

  function jalurDari(geom: any): string {
    return cincinLuar(geom)
      .map(
        (cincin) =>
          cincin
            .map(([lng, lat], i) => {
              const [x, y] = proyeksi(lng, lat);
              return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ') + ' Z'
      )
      .join(' ');
  }

  const kelurahan = kelFC.features.map((f, idx) => ({
    id: f.properties.id || String(idx),
    nama: f.properties.nama,
    d: jalurDari(f.geometry),
    warna: f.properties.warna ?? idx % 3,
  }));

  const kecFC = await batasKecamatanFC();
  const kecamatan = (kecFC?.features || []).map((f, idx) => ({
    id: f.properties.id || String(idx),
    nama: f.properties.nama,
    d: jalurDari(f.geometry),
  }));

  return {
    lebar: LEBAR,
    tinggi: TINGGI,
    kelurahan,
    kecamatan,
    titikPelanggan: [],
    proyeksi: { minLng, maxLat, skala, offsetX, offsetY },
    geoJson: {
      kelurahan: kelFC as any,
      kecamatan: (kecFC || { type: 'FeatureCollection', features: [] }) as any,
      pelanggan: { type: 'FeatureCollection', features: [] },
    },
  };
}
