/**
 * Router: Modul Manajemen Rute & Mutasi Pelanggan
 * Lapisan: 1. API Gateway / Route Handler (Elysia + TypeBox)
 */

import { Elysia, t } from 'elysia';
import type { AppRole } from '@cater/db';
import { authPlugin } from "@cater/backend/plugins/auth";
import { mutasiRuteService } from "@/server/services/rute/mutasi-rute.service";

const RUTE_READ_ROLES: AppRole[] = [
  'SUPERADMIN',
  'EXECUTIVE',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_1',
  'VERIFIKATOR_2',
  'VERIFIKATOR_3',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
];

const RUTE_WRITE_ROLES: AppRole[] = [
  'SUPERADMIN',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_1',
  'VERIFIKATOR_2',
  'VERIFIKATOR_3',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
];

export const ruteRouter = new Elysia({ prefix: '/rute' })
  .use(authPlugin)

  // 1. Ambil opsi wilayah
  .get(
    '/wilayah',
    async () => {
      const data = await mutasiRuteService.getWilayahOpsi();
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
    }
  )

  // 2. Ambil opsi zona teknis
  .get(
    '/zona',
    async () => {
      const data = await mutasiRuteService.getZonaOpsi();
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
    }
  )

  // 3. Ambil daftar petugas per wilayah
  .get(
    '/petugas',
    async ({ query }) => {
      const data = await mutasiRuteService.getPetugasOpsi(query.wilayahId);
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
      query: t.Object({
        wilayahId: t.Optional(t.String()),
      }),
    }
  )

  // 4. Ambil daftar rute milik petugas
  .get(
    '/daftar',
    async ({ query }) => {
      const data = await mutasiRuteService.getRuteByPetugas(query.petugasId);
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
      query: t.Object({
        petugasId: t.String(),
      }),
    }
  )

  // 5. Ambil daftar rute tujuan transfer (selain rute tertentu)
  .get(
    '/tujuan',
    async ({ query }) => {
      const data = await mutasiRuteService.getRuteTujuan(query.kecuali);
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
      query: t.Object({
        kecuali: t.Optional(t.String()),
      }),
    }
  )

  // 6. Ambil pelanggan di suatu rute
  .get(
    '/pelanggan',
    async ({ query, set }) => {
      const ruteKode = query.ruteId || query.rute;
      if (!ruteKode) {
        set.status = 422;
        return { success: false, error: 'Parameter ruteId atau rute wajib disertakan' };
      }
      const data = await mutasiRuteService.getPelangganByRute(ruteKode);
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
      query: t.Object({
        ruteId: t.Optional(t.String()),
        rute: t.Optional(t.String()),
      }),
    }
  )

  // 7. Cari detail pelanggan berdasarkan nomor pelanggan (nolg / noPel)
  .get(
    '/pelanggan/:noPel',
    async ({ params, set }) => {
      const data = await mutasiRuteService.cariPelanggan(params.noPel);
      if (!data) {
        set.status = 404;
        return { success: false, error: `Pelanggan ${params.noPel} tidak ditemukan` };
      }
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
      params: t.Object({
        noPel: t.String(),
      }),
    }
  )

  // 8. Mutasi satu pelanggan ke rute dan nomor urut baru
  .post(
    '/mutasi',
    async ({ body, user, set }) => {
      try {
        const currentUser = user || { id: 'SUPERVISOR', name: 'SUPERVISOR' };
        const data = await mutasiRuteService.mutasiPelanggan(
          {
            noPel: body.noPel,
            wilayahId: body.wilayahId,
            ruteKode: body.ruteKode,
            noUrut: body.noUrut,
            zona: body.zona,
          },
          currentUser
        );
        return { success: true, data };
      } catch (err: any) {
        set.status = err.status || 500;
        return {
          success: false,
          error: err.message || 'Terjadi kesalahan sistem saat memproses mutasi rute pelanggan',
        };
      }
    },
    {
      requireRole: RUTE_WRITE_ROLES,
      body: t.Object({
        noPel: t.String(),
        wilayahId: t.String(),
        ruteKode: t.String(),
        noUrut: t.Number({ minimum: 1 }),
        zona: t.Optional(t.String()),
      }),
    }
  )

  // 9. Penggabungan banyak pelanggan ke rute lain
  .post(
    '/penggabungan',
    async ({ body, user, set }) => {
      try {
        const currentUser = user || { id: 'SUPERVISOR', name: 'SUPERVISOR' };
        const ruteTarget = body.ruteTujuan || (body as any).ruteTujuanId;
        if (!ruteTarget) {
          set.status = 422;
          return { success: false, error: 'Rute tujuan wajib diisi.' };
        }

        const data = await mutasiRuteService.penggabunganRute(
          {
            noPelList: body.noPelList,
            ruteTujuan: ruteTarget,
          },
          currentUser
        );
        return { success: true, data };
      } catch (err: any) {
        set.status = err.status || 500;
        return {
          success: false,
          error: err.message || 'Terjadi kesalahan sistem saat memproses penggabungan rute',
        };
      }
    },
    {
      requireRole: RUTE_WRITE_ROLES,
      body: t.Object({
        noPelList: t.Array(t.String(), { minItems: 1, maxItems: 500 }),
        ruteTujuan: t.Optional(t.String()),
        ruteTujuanId: t.Optional(t.String()),
      }),
    }
  )

  // 10. Ambil riwayat audit log mutasi rute
  .get(
    '/riwayat',
    async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const data = await mutasiRuteService.getRiwayat(limit, query.cursor);
      return { success: true, data };
    },
    {
      requireRole: RUTE_READ_ROLES,
      query: t.Object({
        limit: t.Optional(t.String()),
        cursor: t.Optional(t.String()),
      }),
    }
  );

export const ruteModule = ruteRouter;
