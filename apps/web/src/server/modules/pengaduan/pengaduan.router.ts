import { Elysia, t } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { pengaduanService } from '../../services/pengaduan/pengaduan.service';
import {
  createPengaduanBodySchema,
  tugaskanPengaduanBodySchema,
  ubahStatusPengaduanBodySchema,
} from './pengaduan.schema';

const pengaduanRoutes = new Elysia()
  .use(authPlugin)

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
    async ({ body, user, set }) => {
      try {
        const result = await pengaduanService.tugaskanPengaduan({
          pengaduanId: body.pengaduanId,
          ditugaskanKeId: body.ditugaskanKeId,
          catatan: body.catatan,
          petugasId: user?.id ?? null,
        });
        return { success: true, message: 'Tiket berhasil ditugaskan', data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: tugaskanPengaduanBodySchema,
    }
  )

  // 4. Perubahan Status Pengaduan (Legacy endpoint)
  .patch(
    '/status',
    async ({ body, user, set }) => {
      try {
        const result = await pengaduanService.ubahStatusPengaduan({
          pengaduanId: body.pengaduanId,
          statusKe: body.statusKe,
          catatan: body.catatan,
          fotoPenyelesaianUrl: body.fotoPenyelesaianUrl,
          petugasId: user?.id ?? null,
        });
        return {
          success: true,
          message: `Status berhasil diubah ke ${body.statusKe}`,
          data: result,
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
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
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
        q: t.Optional(t.String()),
        status: t.Optional(t.String()),
        prioritas: t.Optional(t.String()),
        jenis: t.Optional(t.String()),
        ditugaskanKeId: t.Optional(t.String()),
        melanggarSla: t.Optional(t.Union([t.Boolean(), t.String()])),
      }),
    }
  )

  // 6. Pendaftaran Tiket Pengaduan Baru (Internal Staf)
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
      body: createPengaduanBodySchema,
    }
  )

  // 7. Detail Pengaduan Lengkap (Dossier Tiket, Linimasa, & Tindakan Sah)
  .get(
    '/:id',
    async ({ params: { id }, set }) => {
      try {
        const data = await pengaduanService.getDetailPengaduanFull(id);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
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
    async ({ params: { id }, body, user, set }) => {
      try {
        const result = await pengaduanService.tugaskanPengaduan({
          pengaduanId: id,
          ditugaskanKeId: (body as any).ditugaskanKeId,
          catatan: (body as any).catatan,
          petugasId: user?.id ?? null,
        });
        return { success: true, message: 'Tiket berhasil ditugaskan', data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        ditugaskanKeId: t.String({ minLength: 1 }),
        catatan: t.Optional(t.String()),
      }),
    }
  )

  // 9. Transisi Status RESTful (PATCH /:id/status)
  .patch(
    '/:id/status',
    async ({ params: { id }, body, user, set }) => {
      try {
        const b = body as any;
        const result = await pengaduanService.ubahStatusPengaduan({
          pengaduanId: id,
          statusKe: b.status,
          catatan: b.catatan,
          fotoPenyelesaianUrl: b.fotoPenyelesaianUrl,
          petugasId: user?.id ?? null,
        });
        return { success: true, message: `Status berhasil diubah ke ${b.status}`, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        status: t.String(),
        catatan: t.Optional(t.String()),
        fotoPenyelesaianUrl: t.Optional(t.String()),
      }),
    }
  )

  // 10. Tambah Catatan Linimasa (POST /:id/catatan)
  .post(
    '/:id/catatan',
    async ({ params: { id }, body, user, set }) => {
      try {
        const b = body as any;
        const result = await pengaduanService.tambahCatatanPengaduan({
          pengaduanId: id,
          catatan: b.catatan,
          isPublik: b.isPublik,
          petugasId: user?.id ?? null,
        });
        return { success: true, message: 'Catatan berhasil ditambahkan', data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        catatan: t.String({ minLength: 1 }),
        isPublik: t.Optional(t.Boolean()),
      }),
    }
  )

  // 11. Kirim Chat Interaksi Petugas-Warga (POST /:id/chat)
  .post(
    '/:id/chat',
    async ({ params: { id }, body, user, set }) => {
      try {
        const b = body as any;
        const result = await pengaduanService.kirimChatPetugas({
          pengaduanId: id,
          pesan: b.pesan ?? b.catatan,
          isPublik: b.isPublik,
          petugasId: user?.id ?? null,
        });
        return { success: true, message: 'Pesan berhasil dikirim', data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        pesan: t.Optional(t.String()),
        catatan: t.Optional(t.String()),
        isPublik: t.Optional(t.Boolean()),
      }),
    }
  )

  // 12. Eskalasi Prioritas & Supervisor (PATCH /:id/eskalasi)
  .patch(
    '/:id/eskalasi',
    async ({ params: { id }, body, user, set }) => {
      try {
        const b = body as any;
        const result = await pengaduanService.eskalasiPengaduan({
          pengaduanId: id,
          prioritasBaru: b.prioritasBaru,
          eskalasiKeId: b.eskalasiKeId,
          catatan: b.catatan,
          petugasId: user?.id ?? null,
        });
        return { success: true, message: 'Pengaduan berhasil dieskalasi', data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        prioritasBaru: t.Optional(t.String()),
        eskalasiKeId: t.Optional(t.String()),
        catatan: t.Optional(t.String()),
      }),
    }
  );

export const pengaduanRouter = new Elysia({ prefix: '/pengaduan' }).use(pengaduanRoutes);
export const pengaduanV1Router = new Elysia({ prefix: '/v1/pengaduan' }).use(pengaduanRoutes);
