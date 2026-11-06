/**
 * Service: Visualisasi Spasial Pemetaan Pelanggan (GeoJSON FeatureCollection)
 * Lapisan: 2. Service Layer (Orkestrasi PostGIS Spasial & GeoJSON Output)
 */

import { eq, and, sql } from 'drizzle-orm';
import { db, pelanggan, caterBacaMeter } from '@cater/db';

export class MapService {
  /**
   * Menghasilkan GeoJSON FeatureCollection untuk visualisasi peta pelanggan & status baca meter
   */
  async getPelangganGeoJson(ruteKode?: string, thbl?: string) {
    const activeThbl = thbl ?? '202601';

    const conditions = [sql`${pelanggan.titikLokasi} is not null`];
    if (ruteKode) {
      conditions.push(eq(pelanggan.ruteKode, ruteKode));
    }

    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        titikLokasi: pelanggan.titikLokasi,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
      })
      .from(pelanggan)
      .leftJoin(
        caterBacaMeter,
        and(
          eq(pelanggan.nolg, caterBacaMeter.nolg),
          eq(caterBacaMeter.thbl, activeThbl)
        )
      )
      .where(and(...conditions))
      .limit(2000);

    const features = rows.map((r) => {
      const geo = r.titikLokasi as { x: number; y: number } | null;
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [geo?.x ?? 0, geo?.y ?? 0],
        },
        properties: {
          nolg: r.nolg,
          nama: r.nama,
          alamat: r.alamat,
          tarifKode: r.tarifKode,
          ruteKode: r.ruteKode,
          isTercatat: r.stma !== null && r.stma !== undefined,
          stma: r.stma,
          pakaiM3: r.pakaiM3,
          ketCatat: r.ketCatat ?? 'BELUM_DIBACA',
          statusVerifikasi: r.statusVerifikasi ?? 'BELUM_DIBACA',
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      thbl: activeThbl,
      total: features.length,
      features,
    };
  }
}

export const mapService = new MapService();
