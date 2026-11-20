import { sql, eq, desc, and, asc } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  daftarCatat,
  rekeningDrd,
  ruteCater,
  petugasCater,
  caterVerifikasiLog,
  periodePenagihan,
  getActivePeriode,
} from '@cater/db';

export class CaterKueriService {
  /**
   * Menghitung ringkasan statistik pembacaan meter dan penagihan
   */
  async getStats(thbl?: string) {
    const targetThbl = thbl || (await getActivePeriode());

    const [periodeRow] = await db
      .select({ status: periodePenagihan.status, jumlahSl: periodePenagihan.jumlahSl })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, targetThbl));

    const isLocked = periodeRow?.status === 'TERKUNCI';
    const snapshotSl = periodeRow?.jumlahSl != null ? Number(periodeRow.jumlahSl) : null;

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
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, targetThbl));

    const [drdStats] = await db
      .select({
        totalTagihan: sql<number>`COALESCE(SUM(total_tagihan), 0)::float`,
        totalTunggakan: sql<number>`COALESCE(SUM(tag_nunggak), 0)::float`,
      })
      .from(rekeningDrd)
      .where(eq(rekeningDrd.thbl, targetThbl));

    const kondisiBreakdown = await db
      .select({
        kondisi: caterBacaMeter.ketCatat,
        count: sql<number>`count(*)::int`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, targetThbl))
      .groupBy(caterBacaMeter.ketCatat);

    const totalTercatat = caterStats?.totalTercatat ?? 0;
    const rawTotalPelanggan = pelangganCount?.count ?? 0;
    const totalPelanggan = isLocked
      ? (snapshotSl ?? totalTercatat)
      : Math.max(rawTotalPelanggan, snapshotSl ?? 0);

    return {
      totalPelanggan,
      totalRute: ruteCount?.count ?? 0,
      totalPetugas: petugasCount?.count ?? 0,
      totalTercatat,
      totalPakaiM3: caterStats?.totalPakaiM3 ?? 0,
      periodeTerakhir: targetThbl,
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
    thbl?: string
  ) {
    const targetThbl = thbl || (await getActivePeriode());
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
        noUrutRute: pelanggan.noUrutRute,
        readingId: caterBacaMeter.id,
        stml: sql<string | null>`COALESCE(${caterBacaMeter.stml}, ${daftarCatat.standAwal})`,
        pakaiLalu: sql<string | null>`COALESCE(${caterBacaMeter.pakaiLalu}, ${daftarCatat.pakaiLalu})`,
        stmaTerakhir: caterBacaMeter.stma,
        ketCatatTerakhir: caterBacaMeter.ketCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        standSebelumnya: sql<string | null>`COALESCE(
          ${daftarCatat.standAwal},
          (
            select COALESCE(previous.stma_revisi, previous.stma)
            from cater_baca_meter previous
            where previous.nolg = ${pelanggan.nolg}
              and previous.thbl < ${targetThbl}
            order by previous.thbl desc
            limit 1
          )
        )`,
        pakaiSebelumnya: sql<string | null>`COALESCE(
          ${daftarCatat.pakaiLalu},
          (
            select COALESCE(previous.pakai_tagih, previous.pakai_m3_revisi, previous.pakai_m3)
            from cater_baca_meter previous
            where previous.nolg = ${pelanggan.nolg}
              and previous.thbl < ${targetThbl}
            order by previous.thbl desc
            limit 1
          )
        )`,
      })
      .from(pelanggan)
      .leftJoin(
        daftarCatat,
        and(
          eq(pelanggan.nolg, daftarCatat.nolg),
          eq(daftarCatat.periode, targetThbl)
        )
      )
      .leftJoin(
        caterBacaMeter,
        and(
          eq(pelanggan.nolg, caterBacaMeter.nolg),
          eq(caterBacaMeter.thbl, targetThbl)
        )
      )
      .where(and(eq(pelanggan.ruteKode, ruteKode), sql`${pelanggan.status} != 'DICABUT'`))
      .orderBy(asc(pelanggan.noUrutRute), asc(pelanggan.nolg))
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
