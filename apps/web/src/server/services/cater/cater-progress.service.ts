/**
 * Service: Progress Monitoring & Analitik Kinerja (Wilayah, Petugas, Ekstrim, 0 Kubik)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM Query & Agregasi)
 */

import { eq, sql, desc, and } from 'drizzle-orm';
import {
  db,
  caterBacaMeter,
  pelanggan,
  ruteCater,
  petugasCater,
  daftarCatat,
} from '@cater/db';

export class CaterProgressService {
  /**
   * Monitoring Progress Pembacaan Meter Per Wilayah / Seksi (Menu 5.2)
   */
  async getProgressPerWilayah(thbl: string) {
    return db
      .select({
        seksiKode: ruteCater.seksiKode,
        seksiNama: ruteCater.seksiNama,
        totalTarget: sql<number>`count(${daftarCatat.id})::int`,
        totalTercatat: sql<number>`count(case when ${caterBacaMeter.id} is not null then 1 end)::int`,
        persenSelesai: sql<number>`round((count(case when ${caterBacaMeter.id} is not null then 1 end)::numeric / nullif(count(${daftarCatat.id}), 0) * 100), 2)::float`,
      })
      .from(daftarCatat)
      .leftJoin(ruteCater, eq(daftarCatat.ruteKode, ruteCater.kode))
      .leftJoin(
        caterBacaMeter,
        and(
          eq(daftarCatat.nolg, caterBacaMeter.nolg),
          eq(daftarCatat.periode, caterBacaMeter.thbl)
        )
      )
      .where(eq(daftarCatat.periode, thbl))
      .groupBy(ruteCater.seksiKode, ruteCater.seksiNama);
  }

  /**
   * Monitoring Produktivitas Harian Per Petugas Catat Meter (Menu 5.3)
   */
  async getProgressPerCater(thbl: string) {
    return db
      .select({
        petugasId: petugasCater.id,
        petugasNama: petugasCater.nama,
        totalTercatat: sql<number>`count(${caterBacaMeter.id})::int`,
        totalPakaiM3: sql<number>`coalesce(sum(${caterBacaMeter.pakaiM3}::float), 0)::float`,
        totalNormal: sql<number>`count(case when ${caterBacaMeter.ketCatat} = 'Normal' then 1 end)::int`,
        totalKelainan: sql<number>`count(case when ${caterBacaMeter.ketCatat} != 'Normal' then 1 end)::int`,
      })
      .from(petugasCater)
      .leftJoin(
        caterBacaMeter,
        and(
          eq(petugasCater.id, caterBacaMeter.petugasId),
          eq(caterBacaMeter.thbl, thbl)
        )
      )
      .groupBy(petugasCater.id, petugasCater.nama);
  }

  /**
   * Ikhtisar Pemakaian Ekstrim > 100 m3 (Menu 5.5)
   */
  async getIkhtisarEkstrim(thbl: string, limit: number = 50) {
    return db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: caterBacaMeter.ruteKode,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        ketCatat: caterBacaMeter.ketCatat,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(
        and(
          eq(caterBacaMeter.thbl, thbl),
          sql`${caterBacaMeter.pakaiM3}::float > 100`
        )
      )
      .orderBy(desc(sql`${caterBacaMeter.pakaiM3}::float`))
      .limit(limit);
  }

  /**
   * Ikhtisar Pemakaian 0 Kubik (Menu 5.7)
   */
  async getIkhtisarPemakaianNol(thbl: string, limit: number = 50) {
    return db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: caterBacaMeter.ruteKode,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        ketCatat: caterBacaMeter.ketCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(
        and(
          eq(caterBacaMeter.thbl, thbl),
          sql`${caterBacaMeter.pakaiM3}::float = 0`
        )
      )
      .limit(limit);
  }
}

export const caterProgressService = new CaterProgressService();
