import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { pengaduanService } from '../../services/pengaduan/pengaduan.service';
import {
  createPengaduanBodySchema,
  detailPengaduanParamsSchema,
  tugaskanPengaduanBodySchema,
  ubahStatusPengaduanBodySchema,
} from './pengaduan.schema';

export const pengaduanRouter = new Elysia({ prefix: '/pengaduan' })
  .use(authPlugin)

  // 1. Pendaftaran Tiket Pengaduan (Internal Staf / Loket)
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const result = await pengaduanService.createPengaduan(body as any);
        set.status = 201;
        return {
          success: true,
          message: 'Pengaduan berhasil dicatat',
          data: result,
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'EXECUTIVE'],
      body: createPengaduanBodySchema,
    }
  )

  // 2. Detail Pengaduan dan Seluruh Linimasa (Internal)
  .get(
    '/:nomorTiket',
    async ({ params: { nomorTiket }, set }) => {
      try {
        const result = await pengaduanService.getDetailPengaduan(nomorTiket, true);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'EXECUTIVE'],
      params: detailPengaduanParamsSchema,
    }
  )

  // 3. Penugasan Petugas Lapangan
  .post(
    '/tugaskan',
    async ({ body, user, set }) => {
      try {
        const result = await pengaduanService.tugaskanPengaduan({
          pengaduanId: body.pengaduanId,
          ditugaskanKeId: body.ditugaskanKeId,
          catatan: body.catatan,
          petugasId: user!.id,
        });
        return { success: true, message: 'Tiket berhasil ditugaskan', data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2'],
      body: tugaskanPengaduanBodySchema,
    }
  )

  // 4. Perubahan Status Pengaduan (State Machine Transition)
  .patch(
    '/status',
    async ({ body, user, set }) => {
      try {
        const result = await pengaduanService.ubahStatusPengaduan({
          pengaduanId: body.pengaduanId,
          statusKe: body.statusKe,
          catatan: body.catatan,
          fotoPenyelesaianUrl: body.fotoPenyelesaianUrl,
          petugasId: user!.id,
        });
        return { success: true, message: `Status berhasil diubah ke ${body.statusKe}`, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2'],
      body: ubahStatusPengaduanBodySchema,
    }
  );
