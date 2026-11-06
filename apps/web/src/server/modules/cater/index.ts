import { Elysia, t } from 'elysia';
import { sql, eq, desc, and } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  rekeningDrd,
  ruteCater,
  petugasCater,
  golonganTarif,
  caterVerifikasiLog,
  userRoles,
} from '@cater/db';
import { authPlugin } from '../../plugins/auth';

export const caterModule = new Elysia({ prefix: '/cater' })
  .use(authPlugin)
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
  })

  // 6. Riwayat Audit Verifikasi (Audit Trail History)
  .get(
    '/history/:caterId',
    async ({ params: { caterId }, set }) => {
      try {
        const logs = await db
          .select()
          .from(caterVerifikasiLog)
          .where(eq(caterVerifikasiLog.caterId, caterId))
          .orderBy(desc(caterVerifikasiLog.createdAt));

        return {
          success: true,
          data: logs,
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
      params: t.Object({
        caterId: t.String(),
      }),
    }
  )

  // 7. Verifikasi V1 - Supervisor (Seksi / Rute)
  .post(
    '/verify/v1',
    async ({ body, user, set }) => {
      const { caterId, action, catatan } = body;
      const [cater] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));

      if (!cater) {
        set.status = 404;
        return { success: false, error: 'Data baca meter tidak ditemukan' };
      }

      const nextStatus = action === 'APPROVE' ? 'VERIFIED_L1' : 'NEED_RESURVEY';

      await db.transaction(async (tx) => {
        await tx.insert(caterVerifikasiLog).values({
          caterId,
          userId: user!.id,
          stage: 'V1',
          action,
          stmaSebelum: cater.stma,
          stmaSesudah: cater.stma,
          pakaiSebelum: cater.pakaiM3,
          pakaiSesudah: cater.pakaiM3,
          alasan: catatan || (action === 'APPROVE' ? 'Disetujui oleh Supervisor (V1)' : 'Diminta cek ulang fisik lapangan'),
        });

        await tx
          .update(caterBacaMeter)
          .set({
            statusVerifikasi: nextStatus,
            catatan: catatan ? `[V1] ${catatan}` : cater.catatan,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, caterId));
      });

      return {
        success: true,
        message: `Verifikasi V1 berhasil disimpan (${nextStatus})`,
        data: { caterId, statusVerifikasi: nextStatus },
      };
    },
    {
      requireRole: ['VERIFIKATOR_1'],
      body: t.Object({
        caterId: t.String(),
        action: t.Union([t.Literal('APPROVE'), t.Literal('REQUEST_RESURVEY')]),
        catatan: t.Optional(t.String()),
      }),
    }
  )

  // 8. Verifikasi V2 - Manager (Cabang / Wilayah)
  .post(
    '/verify/v2',
    async ({ body, user, set }) => {
      const { caterId, action, stmaKoreksi, catatan } = body;
      const [cater] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));

      if (!cater) {
        set.status = 404;
        return { success: false, error: 'Data baca meter tidak ditemukan' };
      }

      let stmaSesudah = cater.stma;
      let pakaiSesudah = cater.pakaiM3;
      let nextStatus = 'VERIFIED_L2';

      if (action === 'REQUEST_RESURVEY') {
        nextStatus = 'NEED_RESURVEY';
      } else if (action === 'ADJUST_STAND') {
        if (stmaKoreksi === undefined) {
          set.status = 400;
          return { success: false, error: 'stmaKoreksi wajib diisi untuk penyesuaian angka meter' };
        }
        stmaSesudah = String(stmaKoreksi);
        const stmlNum = Number(cater.stml);
        pakaiSesudah = String(stmaKoreksi - stmlNum);
      }

      await db.transaction(async (tx) => {
        await tx.insert(caterVerifikasiLog).values({
          caterId,
          userId: user!.id,
          stage: 'V2',
          action,
          stmaSebelum: cater.stma,
          stmaSesudah,
          pakaiSebelum: cater.pakaiM3,
          pakaiSesudah,
          alasan: catatan || `Verifikasi V2 Cabang: ${action}`,
        });

        await tx
          .update(caterBacaMeter)
          .set({
            stma: stmaSesudah,
            pakaiM3: pakaiSesudah,
            statusVerifikasi: nextStatus,
            catatan: catatan ? `[V2] ${catatan}` : cater.catatan,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, caterId));
      });

      return {
        success: true,
        message: `Verifikasi V2 Cabang berhasil disimpan (${nextStatus})`,
        data: { caterId, statusVerifikasi: nextStatus, stma: stmaSesudah, pakaiM3: pakaiSesudah },
      };
    },
    {
      requireRole: ['VERIFIKATOR_2'],
      body: t.Object({
        caterId: t.String(),
        action: t.Union([t.Literal('APPROVE'), t.Literal('ADJUST_STAND'), t.Literal('REQUEST_RESURVEY')]),
        stmaKoreksi: t.Optional(t.Number()),
        catatan: t.Optional(t.String()),
      }),
    }
  )

  // 9. Verifikasi V3 - Senior Manager / Direksi (Final Release Per Periode)
  .post(
    '/verify/v3',
    async ({ body, user, set }) => {
      const { caterId, catatan } = body;
      const [cater] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));

      if (!cater) {
        set.status = 404;
        return { success: false, error: 'Data baca meter tidak ditemukan' };
      }

      const nextStatus = 'APPROVED_FINAL';

      await db.transaction(async (tx) => {
        await tx.insert(caterVerifikasiLog).values({
          caterId,
          userId: user!.id,
          stage: 'V3',
          action: 'APPROVE',
          stmaSebelum: cater.stma,
          stmaSesudah: cater.stma,
          pakaiSebelum: cater.pakaiM3,
          pakaiSesudah: cater.pakaiM3,
          alasan: catatan || 'Disahkan oleh Senior Manager / Direksi (V3 Final Release)',
        });

        await tx
          .update(caterBacaMeter)
          .set({
            statusVerifikasi: nextStatus,
            catatan: catatan ? `[V3] ${catatan}` : cater.catatan,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, caterId));
      });

      return {
        success: true,
        message: 'Pengesahan akhir V3 berhasil (APPROVED_FINAL)',
        data: { caterId, statusVerifikasi: nextStatus },
      };
    },
    {
      requireRole: ['VERIFIKATOR_3', 'EXECUTIVE'],
      body: t.Object({
        caterId: t.String(),
        catatan: t.Optional(t.String()),
      }),
    }
  )

  // 10. Koreksi Pasca-Verifikasi oleh Staff (Kondisional Guard)
  .post(
    '/staff/correct',
    async ({ body, user, set }) => {
      const { caterId, stmaBaru, pakaiM3Baru, nomorTiketKomplain, alasan } = body;
      const [cater] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, caterId));

      if (!cater) {
        set.status = 404;
        return { success: false, error: 'Data baca meter tidak ditemukan' };
      }

      // KONDISI UTAMA: Cek apakah sudah pernah diverifikasi sebelumnya (harus ada minimal 1 record histori)
      const logs = await db
        .select({ id: caterVerifikasiLog.id })
        .from(caterVerifikasiLog)
        .where(eq(caterVerifikasiLog.caterId, caterId))
        .limit(1);

      if (!logs || logs.length === 0) {
        set.status = 400;
        return {
          success: false,
          error: 'Fitur tidak aktif: Data belum pernah diverifikasi oleh V1-V3. Koreksi oleh Staff tidak diizinkan sebelum verifikasi reguler.',
        };
      }

      // Cegah mutasi jika data sudah berstatus closing tagihan DRD
      if (cater.statusVerifikasi === 'LOCKED_BILLING') {
        set.status = 403;
        return {
          success: false,
          error: 'Data sudah terkunci dalam Rekening Tagihan (DRD). Wajib menggunakan prosedur Berita Acara Khusus.',
        };
      }

      await db.transaction(async (tx) => {
        await tx.insert(caterVerifikasiLog).values({
          caterId,
          userId: user!.id,
          stage: 'STAFF_CORRECTION',
          action: 'STAFF_POST_CORRECT',
          stmaSebelum: cater.stma,
          stmaSesudah: String(stmaBaru),
          pakaiSebelum: cater.pakaiM3,
          pakaiSesudah: String(pakaiM3Baru),
          nomorTiketKomplain,
          alasan,
        });

        await tx
          .update(caterBacaMeter)
          .set({
            stma: String(stmaBaru),
            pakaiM3: String(pakaiM3Baru),
            statusVerifikasi: 'CORRECTED_POST_VERIF',
            catatan: `[Staff Correction] Tiket: ${nomorTiketKomplain ?? '-'} | ${alasan}`,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, caterId));
      });

      return {
        success: true,
        message: 'Koreksi administratif pasca-verifikasi berhasil disimpan',
        data: {
          caterId,
          stmaBaru,
          pakaiM3Baru,
          statusVerifikasi: 'CORRECTED_POST_VERIF',
        },
      };
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING'],
      body: t.Object({
        caterId: t.String(),
        stmaBaru: t.Number(),
        pakaiM3Baru: t.Number(),
        nomorTiketKomplain: t.Optional(t.String()),
        alasan: t.String({ minLength: 5 }),
      }),
    }
  );
