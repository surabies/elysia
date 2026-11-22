import { Elysia, t } from 'elysia';
import type { AppRole } from '@cater/db';
import { authPlugin } from '../../plugins/auth';
import { pengaduanService } from '../../services/pengaduan/pengaduan.service';
import { DomainError } from '../../domain/pengaduan/pengaduan.errors';
import {
  createPengaduanBodySchema,
  tugaskanPengaduanBodySchema,
  ubahStatusPengaduanBodySchema,
  eskalasiPengaduanBodySchema,
  tambahCatatanPengaduanBodySchema,
  kirimChatPengaduanBodySchema,
  listPengaduanQuerySchema,
  statusPengaduanSchema,
} from './pengaduan.schema';

const PENGADUAN_INTERNAL_ROLES: AppRole[] = [
  'SUPERADMIN',
  'EXECUTIVE',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_1',
  'VERIFIKATOR_2',
  'VERIFIKATOR_3',
  'PELAKSANA',
];

const pengaduanRoutes = new Elysia()
  .use(authPlugin)
  .guard({
    requireRole: PENGADUAN_INTERNAL_ROLES,
  })
  // B13: Penanganan error terpusat untuk seluruh endpoint modul pengaduan
  .onError(({ error, set }) => {
    const anyErr = error as any;

    if (error instanceof DomainError) {
      set.status = error.statusCode;
      return {
        success: false,
        error: error.message,
      };
    }

    if (anyErr?.code === 'VALIDATION') {
      set.status = 422;
      const detailMsg = anyErr?.all?.[0]?.summary || anyErr?.all?.[0]?.message;
      return {
        success: false,
        error: detailMsg || anyErr?.message || 'Validasi masukan data pengaduan tidak terpenuhi.',
      };
    }

    const msg = anyErr?.message || '';
    if (msg.includes('tidak ditemukan')) {
      set.status = 404;
      return { success: false, error: msg };
    }
    if (msg.includes('wewenang') || msg.includes('Forbidden') || msg.includes('izin')) {
      set.status = 403;
      return { success: false, error: msg };
    }
    if (
      msg.includes('sudah berubah') ||
      msg.includes('Conflict') ||
      msg.includes('tidak sah') ||
      msg.includes('transisi')
    ) {
      set.status = 409;
      return { success: false, error: msg };
    }
    if (
      msg.includes('wajib') ||
      msg.includes('hanya boleh') ||
      msg.includes('tidak valid') ||
      msg.includes('minimal') ||
      msg.includes('kedaluwarsa') ||
      msg.includes('maksimal')
    ) {
      set.status = 422;
      return { success: false, error: msg };
    }

    console.error('[UNHANDLED_PENGADUAN_ERROR]', error);
    set.status = 500;
    return {
      success: false,
      error: 'Terjadi kesalahan internal pada server.',
    };
  })

  // 1. Ringkasan Statistik Antrean Pengaduan (Desk Kartu KPI)
  .get('/statistik', async () => {
    const data = await pengaduanService.getStatistikPengaduan();
    return { success: true, data };
  })

  // 2. Daftar Petugas Lapangan untuk Penugasan / Eskalasi
  .get('/petugas', async () => {
    const data = await pengaduanService.listPetugasPengaduan();
    return { success: true, data };
  })

  // 3. Penugasan Petugas Lapangan (Legacy endpoint)
  .post(
    '/tugaskan',
    async ({ body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.tugaskanPengaduan({
        pengaduanId: body.pengaduanId,
        ditugaskanKeId: body.ditugaskanKeId,
        catatan: body.catatan,
        petugasId: user?.id ?? null,
        aktor,
      });
      return { success: true, message: 'Tiket berhasil ditugaskan', data: result };
    },
    {
      requireAuth: true,
      body: tugaskanPengaduanBodySchema,
    }
  )

  // 4. Perubahan Status Pengaduan (Legacy endpoint)
  .patch(
    '/status',
    async ({ body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.ubahStatusPengaduan({
        pengaduanId: body.pengaduanId,
        statusKe: body.statusKe,
        catatan: body.catatan,
        fotoPenyelesaianUrl: body.fotoPenyelesaianUrl,
        petugasId: user?.id ?? null,
        aktor,
      });
      return {
        success: true,
        message: `Status berhasil diubah ke ${body.statusKe}`,
        data: result,
      };
    },
    {
      requireAuth: true,
      body: ubahStatusPengaduanBodySchema,
    }
  )

  // 5. Daftar Pengaduan dengan Paginasi & Filter (AG Grid DataGrid)
  .get(
    '/',
    async ({ query }) => {
      const result = await pengaduanService.listPengaduan(query as any);
      return {
        success: true,
        data: result.data,
        meta: result.meta,
      };
    },
    {
      query: listPengaduanQuerySchema,
    }
  )

  // 6. Pendaftaran Tiket Pengaduan Baru (Internal Staf)
  .post(
    '/',
    async ({ body, set }) => {
      const result = await pengaduanService.createPengaduan(body as any);
      set.status = 201;
      return {
        success: true,
        message: 'Pengaduan berhasil dicatat',
        data: result,
      };
    },
    {
      requireAuth: true,
      body: createPengaduanBodySchema,
    }
  )

  // 7. Detail Pengaduan Lengkap (Dossier Tiket, Linimasa, & Tindakan Sah)
  .get(
    '/:id',
    async ({ params: { id }, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const data = await pengaduanService.getDetailPengaduanFull(id, aktor);
      return { success: true, data };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )

  // 8. Penugasan Petugas Lapangan RESTful (PATCH /:id/tugaskan)
  .patch(
    '/:id/tugaskan',
    async ({ params: { id }, body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.tugaskanPengaduan({
        pengaduanId: id,
        ditugaskanKeId: body.ditugaskanKeId,
        catatan: body.catatan,
        petugasId: user?.id ?? null,
        aktor,
      });
      return { success: true, message: 'Tiket berhasil ditugaskan', data: result };
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: t.Object({
        ditugaskanKeId: t.String({ minLength: 1 }),
        catatan: t.Optional(t.String()),
      }),
    }
  )

  // 9. Transisi Status RESTful (PATCH /:id/status)
  .patch(
    '/:id/status',
    async ({ params: { id }, body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.ubahStatusPengaduan({
        pengaduanId: id,
        statusKe: body.status,
        catatan: body.catatan,
        fotoPenyelesaianUrl: body.fotoPenyelesaianUrl,
        petugasId: user?.id ?? null,
        aktor,
      });
      return {
        success: true,
        message: `Status berhasil diubah ke ${body.status}`,
        data: result,
      };
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: t.Object({
        status: statusPengaduanSchema,
        catatan: t.Optional(t.String()),
        fotoPenyelesaianUrl: t.Optional(t.String()),
      }),
    }
  )

  // 10. Tambah Catatan Linimasa (POST /:id/catatan)
  .post(
    '/:id/catatan',
    async ({ params: { id }, body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.tambahCatatanPengaduan({
        pengaduanId: id,
        catatan: body.catatan,
        isPublik: body.isPublik,
        petugasId: user?.id ?? null,
        aktor,
      });
      return { success: true, message: 'Catatan berhasil ditambahkan', data: result };
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: tambahCatatanPengaduanBodySchema,
    }
  )

  // 11. Kirim Chat Interaksi Petugas-Warga (POST /:id/chat)
  .post(
    '/:id/chat',
    async ({ params: { id }, body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.kirimChatPetugas({
        pengaduanId: id,
        pesan: (body.pesan ?? body.catatan)!,
        isPublik: body.isPublik,
        petugasId: user?.id ?? null,
        aktor,
      });
      return { success: true, message: 'Pesan berhasil dikirim', data: result };
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: kirimChatPengaduanBodySchema,
    }
  )

  // 12. Eskalasi Prioritas & Supervisor (PATCH /:id/eskalasi)
  .patch(
    '/:id/eskalasi',
    async ({ params: { id }, body, user, userRoles }) => {
      const aktor = { id: user?.id, role: userRoles?.[0] };
      const result = await pengaduanService.eskalasiPengaduan({
        pengaduanId: id,
        prioritasBaru: body.prioritasBaru,
        eskalasiKeId: body.eskalasiKeId,
        catatan: body.catatan,
        petugasId: user?.id ?? null,
        aktor,
      });
      return { success: true, message: 'Pengaduan berhasil dieskalasi', data: result };
    },
    {
      params: t.Object({ id: t.String({ minLength: 1 }) }),
      body: eskalasiPengaduanBodySchema,
    }
  );

export const pengaduanRouter = new Elysia({ prefix: '/pengaduan' }).use(pengaduanRoutes);
export const pengaduanV1Router = new Elysia({ prefix: '/v1/pengaduan' }).use(pengaduanRoutes);
