import { sql, eq, desc, and } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
  ruteCater,
  petugasCater,
  caterVerifikasiLog,
} from '@cater/db';

export class CaterKueriService {
  /**
   * Menghitung ringkasan statistik pembacaan meter dan penagihan
   */
  async getStats() {
    const [pelangganCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pelanggan);

    const [ruteCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ruteCater);

    const [petugasCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(petugasCater);

    const [caterStats] = await db
      .select({
        totalTercatat: sql<number>`count(*)::int`,
        totalPakaiM3: sql<number>`COALESCE(SUM(pakai_m3), 0)::float`,
        periodeTerakhir: sql<string | null>`MAX(${caterBacaMeter.thbl})`,
      })
      .from(caterBacaMeter);

    const [drdStats] = await db
      .select({
        totalTagihan: sql<number>`COALESCE(SUM(total_tagihan), 0)::float`,
        totalTunggakan: sql<number>`COALESCE(SUM(tag_nunggak), 0)::float`,
      })
      .from(rekeningDrd);

    const kondisiBreakdown = await db
      .select({
        kondisi: caterBacaMeter.ketCatat,
        count: sql<number>`count(*)::int`,
      })
      .from(caterBacaMeter)
      .groupBy(caterBacaMeter.ketCatat);

    return {
      totalPelanggan: pelangganCount?.count ?? 0,
      totalRute: ruteCount?.count ?? 0,
      totalPetugas: petugasCount?.count ?? 0,
      totalTercatat: caterStats?.totalTercatat ?? 0,
      totalPakaiM3: caterStats?.totalPakaiM3 ?? 0,
      periodeTerakhir: caterStats?.periodeTerakhir ?? null,
      totalTagihan: drdStats?.totalTagihan ?? 0,
      totalTunggakan: drdStats?.totalTunggakan ?? 0,
      kondisiBreakdown,
    };
  }

  /**
   * Mengambil daftar rute cater beserta jumlah pelanggan
   */
  async getRoutes(limit: number = 50, offset: number = 0) {
    return db
      .select({
        kode: ruteCater.kode,
        seksiKode: ruteCater.seksiKode,
        seksiNama: ruteCater.seksiNama,
        petugasDefault: ruteCater.pencatatDefault,
        customerCount: sql<number>`count(${pelanggan.nolg})::int`,
      })
      .from(ruteCater)
      .leftJoin(pelanggan, eq(ruteCater.kode, pelanggan.ruteKode))
      .groupBy(ruteCater.kode, ruteCater.seksiKode, ruteCater.seksiNama, ruteCater.pencatatDefault)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Mengunduh daftar pelanggan per rute untuk pembacaan offline mobile
   */
  async getRoutePelanggan(
    ruteKode: string,
    limit: number = 500,
    thbl: string = '202601'
  ) {
    const list = await db
      .select({
        nolg: pelanggan.nolg,
        nprs: pelanggan.nprs,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        rt: pelanggan.rt,
        rw: pelanggan.rw,
        noTelp: pelanggan.noTelp,
        isMbr: pelanggan.isMbr,
        status: pelanggan.status,
        tarifKode: pelanggan.tarifKode,
        noMeter: pelanggan.noMeter,
        readingId: caterBacaMeter.id,
        stml: caterBacaMeter.stml,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        stmaTerakhir: caterBacaMeter.stma,
        ketCatatTerakhir: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        standSebelumnya: sql<string | null>`(
          select previous.stma
          from cater_baca_meter previous
          where previous.nolg = ${pelanggan.nolg}
            and previous.thbl < ${thbl}
          order by previous.thbl desc
          limit 1
        )`,
        pakaiSebelumnya: sql<string | null>`(
          select previous.pakai_m3
          from cater_baca_meter previous
          where previous.nolg = ${pelanggan.nolg}
            and previous.thbl < ${thbl}
          order by previous.thbl desc
          limit 1
        )`,
      })
      .from(pelanggan)
      .leftJoin(
        caterBacaMeter,
        and(
          eq(pelanggan.nolg, caterBacaMeter.nolg),
          eq(caterBacaMeter.thbl, thbl)
        )
      )
      .where(eq(pelanggan.ruteKode, ruteKode))
      .limit(limit);

    return {
      ruteKode,
      total: list.length,
      list,
    };
  }

  /**
   * Mengambil daftar anomali pembacaan meter untuk diverifikasi supervisor
   */
  async getAnomalies(limit: number = 50) {
    return db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        ketCatat: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(
        sql`${caterBacaMeter.ketCatat} != 'Normal' OR ${caterBacaMeter.pakaiM3}::float > 100`
      )
      .limit(limit);
  }

  /**
   * Mengambil riwayat audit log verifikasi dari suatu pembacaan meter
   */
  async getAuditHistory(caterId: string) {
    return db
      .select()
      .from(caterVerifikasiLog)
      .where(eq(caterVerifikasiLog.caterId, caterId))
      .orderBy(desc(caterVerifikasiLog.createdAt));
  }
}

export const caterKueriService = new CaterKueriService();
