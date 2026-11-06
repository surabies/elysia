import { Elysia, t } from 'elysia';
import { sql, eq, desc, and } from 'drizzle-orm';
import { db } from '@cater/db';
import {
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
  ruteCater,
  petugasCater,
  golonganTarif,
} from '@cater/db';

export const caterModule = new Elysia({ prefix: '/cater' })
  // 1. Dashboard Overview Stats
  .get('/stats', async () => {
    try {
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
        success: true,
        data: {
          totalPelanggan: pelangganCount?.count ?? 0,
          totalRute: ruteCount?.count ?? 0,
          totalPetugas: petugasCount?.count ?? 0,
          totalTercatat: caterStats?.totalTercatat ?? 0,
          totalPakaiM3: caterStats?.totalPakaiM3 ?? 0,
          totalTagihan: drdStats?.totalTagihan ?? 0,
          totalTunggakan: drdStats?.totalTunggakan ?? 0,
          kondisiBreakdown,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  })

  // 2. Get list of all routes with customer count
  .get('/routes', async ({ query }) => {
    const limit = Number(query.limit ?? 50);
    const offset = Number(query.offset ?? 0);

    try {
      const routes = await db
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

      return {
        success: true,
        data: routes,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  })

  // 3. Download route task list for Mobile Offline Reading
  .get(
    '/routes/:kode/pelanggan',
    async ({ params, query }) => {
      const ruteKode = params.kode;
      const limit = Number(query.limit ?? 500);

      try {
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
            stml: caterBacaMeter.stml,
            pakaiLalu: caterBacaMeter.pakaiLalu,
            stmaTerakhir: caterBacaMeter.stma,
            ketCatatTerakhir: caterBacaMeter.ketCatat,
          })
          .from(pelanggan)
          .leftJoin(
            caterBacaMeter,
            and(
              eq(pelanggan.nolg, caterBacaMeter.nolg),
              eq(caterBacaMeter.thbl, '202601')
            )
          )
          .where(eq(pelanggan.ruteKode, ruteKode))
          .limit(limit);

        return {
          success: true,
          ruteKode,
          total: list.length,
          data: list,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
        };
      }
    },
    {
      params: t.Object({
        kode: t.String(),
      }),
    }
  )

  // 4. Submit Reading from Mobile App (Field Cater)
  .post(
    '/readings',
    async ({ body, set }) => {
      const {
        thbl,
        nolg,
        ruteKode,
        petugasId,
        stml,
        stma,
        kondisiCatat,
        metodeCatat,
        fotoMeterUrl,
        fotoRumahUrl,
        durasiDetik,
        catatan,
        longitude,
        latitude,
      } = body;

      const pakaiM3 = stma - stml;

      // Anomaly detection rules
      let statusVerifikasi = 'SUBMITTED';
      if (pakaiM3 < 0) {
        statusVerifikasi = 'ANOMALY_NEGATIVE'; // Meter terbalik / mundur
      } else if (pakaiM3 > 100) {
        statusVerifikasi = 'ANOMALY_HIGH'; // Lonjakan drastis
      }

      try {
        const id = `cater-${thbl}-${nolg}`;

        await db
          .insert(caterBacaMeter)
          .values({
            id,
            thbl,
            nolg,
            ruteKode,
            petugasId,
            stml: String(stml),
            stma: String(stma),
            pakaiM3: String(pakaiM3),
            ketCatat: kondisiCatat || 'Normal',
            metodeCatat: metodeCatat || 'ONSITE',
            fotoMeterUrl,
            fotoRumahUrl,
            durasiDetik: durasiDetik || 0,
            statusVerifikasi,
            catatan,
            lokasiGps: longitude && latitude ? { x: longitude, y: latitude } : null,
          })
          .onConflictDoUpdate({
            target: caterBacaMeter.id,
            set: {
              stma: String(stma),
              pakaiM3: String(pakaiM3),
              ketCatat: kondisiCatat || 'Normal',
              metodeCatat: metodeCatat || 'ONSITE',
              fotoMeterUrl,
              fotoRumahUrl,
              durasiDetik: durasiDetik || 0,
              statusVerifikasi,
              catatan,
              updatedAt: new Date(),
            },
          });

        set.status = 201;
        return {
          success: true,
          message: 'Meter reading recorded successfully',
          data: {
            id,
            nolg,
            stma,
            stml,
            pakaiM3,
            statusVerifikasi,
          },
        };
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          error: err.message,
        };
      }
    },
    {
      body: t.Object({
        thbl: t.String({ minLength: 6, maxLength: 6 }),
        nolg: t.String({ minLength: 1 }),
        ruteKode: t.Optional(t.String()),
        petugasId: t.Optional(t.String()),
        stml: t.Number(),
        stma: t.Number(),
        kondisiCatat: t.Optional(t.String()),
        metodeCatat: t.Optional(t.String()),
        fotoMeterUrl: t.Optional(t.String()),
        fotoRumahUrl: t.Optional(t.String()),
        durasiDetik: t.Optional(t.Number()),
        catatan: t.Optional(t.String()),
        longitude: t.Optional(t.Number()),
        latitude: t.Optional(t.Number()),
      }),
    }
  )

  // 5. Anomaly List for Supervisor Verification
  .get('/anomalies', async ({ query }) => {
    const limit = Number(query.limit ?? 50);

    try {
      const anomalies = await db
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

      return {
        success: true,
        count: anomalies.length,
        data: anomalies,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  });
