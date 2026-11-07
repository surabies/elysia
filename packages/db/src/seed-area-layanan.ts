import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db } from './client';
import { areaLayanan, type MultiPolygonGeometry } from './schema';

interface AreaLayananFeature {
  type: 'Feature';
  properties: {
    KODE_DESA: string;
    DESA_KELUR: string;
    KECAMATAN: string;
  };
  geometry: MultiPolygonGeometry | null;
}

interface AreaLayananCollection {
  type: 'FeatureCollection';
  features: AreaLayananFeature[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMultiPolygonGeometry(value: unknown): value is MultiPolygonGeometry {
  if (
    !isRecord(value) ||
    value.type !== 'MultiPolygon' ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length === 0
  ) {
    return false;
  }

  return value.coordinates.every(
    (polygon) =>
      Array.isArray(polygon) &&
      polygon.length > 0 &&
      polygon.every(
        (ring) =>
          Array.isArray(ring) &&
          ring.length >= 4 &&
          ring.every(
            (position) =>
              Array.isArray(position) &&
              position.length >= 2 &&
              position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate)),
          ),
      ),
  );
}

function parseAreaLayananCollection(value: unknown): AreaLayananCollection {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    throw new Error('Area layanan GeoJSON must be a FeatureCollection.');
  }

  const features = value.features.map((feature, index): AreaLayananFeature => {
    if (
      !isRecord(feature) ||
      feature.type !== 'Feature' ||
      !isRecord(feature.properties) ||
      !isRecord(feature.geometry)
    ) {
      throw new Error(`Invalid area layanan feature at index ${index}.`);
    }

    const { KODE_DESA, DESA_KELUR, KECAMATAN } = feature.properties;
    const geometry = feature.geometry;
    if (
      typeof KODE_DESA !== 'string' ||
      !KODE_DESA.trim() ||
      typeof DESA_KELUR !== 'string' ||
      !DESA_KELUR.trim() ||
      typeof KECAMATAN !== 'string' ||
      !KECAMATAN.trim() ||
      geometry.type !== 'MultiPolygon' ||
      !Array.isArray(geometry.coordinates)
    ) {
      throw new Error(`Area layanan feature ${index} is missing required fields or geometry.`);
    }

    const validGeometry =
      geometry.coordinates.length === 0
        ? null
        : isMultiPolygonGeometry(geometry)
          ? geometry
          : null;
    if (geometry.coordinates.length > 0 && validGeometry === null) {
      throw new Error(`Area layanan feature ${index} has invalid MultiPolygon coordinates.`);
    }

    return {
      type: 'Feature',
      properties: {
        KODE_DESA: KODE_DESA.trim(),
        DESA_KELUR: DESA_KELUR.trim(),
        KECAMATAN: KECAMATAN.trim(),
      },
      geometry: validGeometry,
    };
  });

  const codes = new Set(features.map((feature) => feature.properties.KODE_DESA));
  if (codes.size !== features.length) {
    throw new Error('Area layanan GeoJSON contains duplicate KODE_DESA values.');
  }

  return { type: 'FeatureCollection', features };
}

async function seedAreaLayanan() {
  const sourcePath = path.resolve(__dirname, '../data/Area_layanan.geojson');
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as unknown;
  const collection = parseAreaLayananCollection(source);
  const missingGeometry = collection.features.filter(
    (feature) => feature.geometry === null,
  );

  if (process.argv.includes('--dry-run')) {
    console.log(
      `Validated ${collection.features.length} service areas; ${missingGeometry.length} have empty geometry and will not be drawn (${missingGeometry.map((feature) => feature.properties.DESA_KELUR).join(', ')}). Database was not changed.`,
    );
    return;
  }

  await db
    .insert(areaLayanan)
    .values(
      collection.features.map((feature) => ({
        kodeDesa: feature.properties.KODE_DESA,
        kelurahan: feature.properties.DESA_KELUR,
        kecamatan: feature.properties.KECAMATAN,
        geometry: feature.geometry,
      })),
    )
    .onConflictDoUpdate({
      target: areaLayanan.kodeDesa,
      set: {
        kelurahan: sql`excluded."kelurahan"`,
        kecamatan: sql`excluded."kecamatan"`,
        geometry: sql`excluded."geometry"`,
        updatedAt: new Date(),
      },
    });

  console.log(
    `Seeded ${collection.features.length} service areas; ${missingGeometry.length} have empty geometry (${missingGeometry.map((feature) => feature.properties.DESA_KELUR).join(', ')}).`,
  );
}

seedAreaLayanan().catch((error: unknown) => {
  console.error('Area layanan seeding failed:', error);
  process.exitCode = 1;
});
