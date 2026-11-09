/**
 * Service: Visualisasi Spasial Pemetaan Pelanggan & Anti-Nembak Meter (PostGIS Spasial)
 * Lapisan: 2. Service Layer (Orkestrasi PostGIS Spasial & GeoJSON Output)
 */

import { eq, and, sql, or, isNotNull } from 'drizzle-orm';
import { db, pelanggan, caterBacaMeter, petugasCater, ruteCater } from '@cater/db';

export interface GisMeterFilter {
  ruteKode?: string;
  thbl?: string;
  hanyaAnomali?: boolean;
  hanyaGeofenceAlert?: boolean;
  limit?: number;
}

export class MapService {
  /**
   * Mengambil data pemetaan meter spasial lengkap dengan deteksi geofence deviasi jarak
   */
  async getMonitoringSpasial(filter: GisMeterFilter = {}) {
    const activeThbl = filter.thbl ?? '202601';
    const limit = Math.min(filter.limit ?? 500, 2000);

    const conditions = [sql`${pelanggan.titikLokasi} is not null`];
    if (filter.ruteKode) {
      conditions.push(eq(pelanggan.ruteKode, filter.ruteKode));
    }

    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        titikLokasi: pelanggan.titikLokasi,
        caterId: caterBacaMeter.id,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        lokasiGps: caterBacaMeter.lokasiGps,
        jarakPelangganMeter: caterBacaMeter.jarakPelangganMeter,
        petugasId: caterBacaMeter.petugasId,
        namaPetugas: petugasCater.nama,
        tglCatat: caterBacaMeter.tglCatat,
      })
      .from(pelanggan)
      .leftJoin(
        caterBacaMeter,
        and(
          eq(pelanggan.nolg, caterBacaMeter.nolg),
          eq(caterBacaMeter.thbl, activeThbl)
        )
      )
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .where(and(...conditions))
      .limit(limit);

    let totalTercatat = 0;
    let totalAnomali = 0;
    let totalGeofenceAlert = 0;

    const data = rows.map((r) => {
      const custGeo = r.titikLokasi as { x: number; y: number } | null;
      const caterGeo = r.lokasiGps as { x: number; y: number } | null;

      const isTercatat = r.stma !== null && r.stma !== undefined;
      if (isTercatat) totalTercatat++;

      const isAnomali =
        Boolean(r.statusVerifikasi && r.statusVerifikasi.includes('ANOMALY')) ||
        (r.pakaiM3 !== null && Number(r.pakaiM3) < 0) ||
        (r.ketCatat !== null && !['Normal', 'nihil', ''].includes(r.ketCatat.trim()));
      if (isAnomali) totalAnomali++;

      const jarakMeter = r.jarakPelangganMeter ? Number(r.jarakPelangganMeter) : null;
      const isGeofenceAlert = Boolean(jarakMeter !== null && jarakMeter > 50);
      if (isGeofenceAlert) totalGeofenceAlert++;

      return {
        nolg: r.nolg,
        nama: r.nama,
        alamat: r.alamat,
        tarifKode: r.tarifKode,
        ruteKode: r.ruteKode,
        pelangganCoord: custGeo ? [custGeo.x, custGeo.y] : null,
        caterCoord: caterGeo ? [caterGeo.x, caterGeo.y] : null,
        jarakMeter,
        isGeofenceAlert,
        isTercatat,
        isAnomali,
        stml: r.stml ? Number(r.stml) : null,
        stma: r.stma ? Number(r.stma) : null,
        pakaiM3: r.pakaiM3 ? Number(r.pakaiM3) : null,
        ketCatat: r.ketCatat ?? 'BELUM_DIBACA',
        statusVerifikasi: r.statusVerifikasi ?? 'BELUM_DIBACA',
        fotoMeterUrl: r.fotoMeterUrl,
        petugasId: r.petugasId,
        namaPetugas: r.namaPetugas ?? (r.petugasId ? `Petugas #${r.petugasId}` : '—'),
        tglCatat: r.tglCatat ? new Date(r.tglCatat).toISOString() : null,
      };
    });

    // Filter post-query if requested
    let filteredData = data;
    if (filter.hanyaAnomali) {
      filteredData = filteredData.filter((d) => d.isAnomali);
    }
    if (filter.hanyaGeofenceAlert) {
      filteredData = filteredData.filter((d) => d.isGeofenceAlert);
    }

    return {
      thbl: activeThbl,
      summary: {
        totalTitik: data.length,
        tercatat: totalTercatat,
        belumTercatat: data.length - totalTercatat,
        anomali: totalAnomali,
        geofenceAlert: totalGeofenceAlert,
      },
      items: filteredData,
    };
  }

  /**
   * Menghasilkan GeoJSON FeatureCollection untuk visualisasi peta
   */
  async getPelangganGeoJson(ruteKode?: string, thbl?: string) {
    const monitoring = await this.getMonitoringSpasial({ ruteKode, thbl });

    const features = monitoring.items.map((item) => {
      const coords = item.pelangganCoord ?? [107.6191, -6.9175];
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: coords,
        },
        properties: {
          nolg: item.nolg,
          nama: item.nama,
          alamat: item.alamat,
          tarifKode: item.tarifKode,
          ruteKode: item.ruteKode,
          isTercatat: item.isTercatat,
          isAnomali: item.isAnomali,
          isGeofenceAlert: item.isGeofenceAlert,
          jarakMeter: item.jarakMeter,
          stma: item.stma,
          pakaiM3: item.pakaiM3,
          ketCatat: item.ketCatat,
          statusVerifikasi: item.statusVerifikasi,
          caterCoord: item.caterCoord,
          fotoMeterUrl: item.fotoMeterUrl,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      thbl: monitoring.thbl,
      summary: monitoring.summary,
      total: features.length,
      features,
    };
  }
}

export const mapService = new MapService();
