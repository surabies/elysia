import { Elysia, t } from 'elysia';
import type { AppRole } from '@cater/db';
import { authPlugin } from '../../plugins/auth';
import { broadcastService } from '../../services/broadcast/broadcast.service';

const BROADCAST_ADMIN_ROLES: AppRole[] = [
  'SUPERADMIN',
  'EXECUTIVE',
  'STAFF_ADMIN_BILLING',
];

export const broadcastRouter = new Elysia({ prefix: '/broadcast' })
  .use(authPlugin)

  // === ENDPOINT PUBLIK (Read-only untuk tampilan Landing Page) ===

  // 1. Ambil siaran aktif untuk konsumsi publik
  .get('/public', async () => {
    const data = await broadcastService.getPublicBroadcasts();
    return {
      success: true,
      data,
    };
  })

  // 2. Ambil Konten Seksi Landing Page (CMS Dinamis publik)
  .get('/landing-sections', async () => {
    const data = await broadcastService.getLandingCMS();
    return {
      success: true,
      data,
    };
  })

  // === ENDPOINT TERPROTEKSI (Hanya Admin / Staf Berwenang) ===
  .guard({
    requireRole: BROADCAST_ADMIN_ROLES,
  })

  // 3. Ambil semua siaran (Dashboard Admin)
  .get('/', async () => {
    const data = await broadcastService.getAllBroadcasts();
    return {
      success: true,
      data,
    };
  })

  // 4. Simpan & Reset Konten Seksi Landing Page
  .put(
    '/landing-sections',
    async ({ body, set }) => {
      try {
        const data = await broadcastService.updateLandingCMS(body as any);
        return {
          success: true,
          message: 'Konten seksi Landing Page berhasil disimpan ke database',
          data,
        };
      } catch (err: any) {
        set.status = 400;
        return {
          success: false,
          error: err.message || 'Gagal menyimpan konten seksi Landing Page',
        };
      }
    },
    {
      body: t.Any(),
    }
  )
  .post('/landing-sections/reset', async () => {
    const data = await broadcastService.resetLandingCMS();
    return {
      success: true,
      message: 'Konten seksi Landing Page berhasil di-reset ke default',
      data,
    };
  })

  // 3. Detail broadcast spesifik
  .get('/:id', async ({ params: { id }, set }) => {
    const item = await broadcastService.getBroadcastById(id);
    if (!item) {
      set.status = 404;
      return { success: false, error: 'Broadcast tidak ditemukan' };
    }
    return { success: true, data: item };
  })

  // 4. Tambah broadcast baru
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const item = await broadcastService.createBroadcast(body as any);
        set.status = 201;
        return {
          success: true,
          message: 'Siaran berhasil diterbitkan',
          data: item,
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || 'Gagal membuat siaran' };
      }
    },
    {
      body: t.Object({
        id: t.Optional(t.String()),
        judul: t.String(),
        ringkasan: t.String(),
        kategori: t.Union([
          t.Literal('DARURAT'),
          t.Literal('PEMELIHARAAN'),
          t.Literal('EVENT'),
          t.Literal('INFORMASI'),
          t.Literal('KEGIATAN'),
        ]),
        status: t.Union([
          t.Literal('DALAM_PENGERJAAN'),
          t.Literal('SELESAI'),
          t.Literal('TERJADWAL'),
        ]),
        progresPersen: t.Number(),
        prioritas: t.Union([
          t.Literal('TINGGI'),
          t.Literal('SEDANG'),
          t.Literal('NORMAL'),
        ]),
        waktuMulai: t.String(),
        estimasiSelesai: t.String(),
        penyebab: t.Optional(t.String()),
        dampak: t.Optional(t.String()),
        tindakanPenanganan: t.Optional(t.String()),
        wilayahTerdampak: t.Optional(t.Any()),
        kontakBantuan: t.Optional(t.Any()),
        gambarUtama: t.Optional(t.String()),
        gambarUtamaPublicId: t.Optional(t.String()),
        tipeGambarUtama: t.Optional(t.String()),
        galeriMedia: t.Optional(t.Any()),
        promoDetails: t.Optional(t.Any()),
        lokasiWilayah: t.Optional(t.String()),
        aktif: t.Optional(t.Boolean()),
        tampilkanDiTicker: t.Optional(t.Boolean()),
        tampilkanDiSpotlight: t.Optional(t.Boolean()),
        urutan: t.Optional(t.Number()),
      }),
    }
  )

  // 5. Update broadcast
  .put(
    '/:id',
    async ({ params: { id }, body, set }) => {
      try {
        const item = await broadcastService.updateBroadcast(id, body as any);
        return {
          success: true,
          message: 'Siaran berhasil diperbarui',
          data: item,
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message || 'Gagal memperbarui siaran' };
      }
    },
    {
      body: t.Object({
        judul: t.Optional(t.String()),
        ringkasan: t.Optional(t.String()),
        kategori: t.Optional(
          t.Union([
            t.Literal('DARURAT'),
            t.Literal('PEMELIHARAAN'),
            t.Literal('EVENT'),
            t.Literal('INFORMASI'),
            t.Literal('KEGIATAN'),
          ])
        ),
        status: t.Optional(
          t.Union([
            t.Literal('DALAM_PENGERJAAN'),
            t.Literal('SELESAI'),
            t.Literal('TERJADWAL'),
          ])
        ),
        progresPersen: t.Optional(t.Number()),
        prioritas: t.Optional(
          t.Union([
            t.Literal('TINGGI'),
            t.Literal('SEDANG'),
            t.Literal('NORMAL'),
          ])
        ),
        waktuMulai: t.Optional(t.String()),
        estimasiSelesai: t.Optional(t.String()),
        penyebab: t.Optional(t.String()),
        dampak: t.Optional(t.String()),
        tindakanPenanganan: t.Optional(t.String()),
        wilayahTerdampak: t.Optional(t.Any()),
        kontakBantuan: t.Optional(t.Any()),
        gambarUtama: t.Optional(t.String()),
        gambarUtamaPublicId: t.Optional(t.String()),
        tipeGambarUtama: t.Optional(t.String()),
        galeriMedia: t.Optional(t.Any()),
        promoDetails: t.Optional(t.Any()),
        lokasiWilayah: t.Optional(t.String()),
        aktif: t.Optional(t.Boolean()),
        tampilkanDiTicker: t.Optional(t.Boolean()),
        tampilkanDiSpotlight: t.Optional(t.Boolean()),
        urutan: t.Optional(t.Number()),
      }),
    }
  )

  // 6. Saklar Cepat Toggle Status Aktif
  .patch('/:id/toggle', async ({ params: { id }, set }) => {
    try {
      const item = await broadcastService.toggleAktif(id);
      return {
        success: true,
        message: `Status siaran diubah menjadi ${item.aktif ? 'AKTIF' : 'NONAKTIF'}`,
        data: item,
      };
    } catch (err: any) {
      set.status = 400;
      return { success: false, error: err.message || 'Gagal mengubah status siaran' };
    }
  })

  // 7. Reset data ke default Tirtawening
  .post('/reset', async () => {
    const data = await broadcastService.resetToDefault();
    return {
      success: true,
      message: 'Data siaran berhasil di-reset ke default Tirtawening',
      data,
    };
  })

  // 8. Hapus broadcast
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      const success = await broadcastService.deleteBroadcast(id);
      if (!success) {
        set.status = 404;
        return { success: false, error: 'Broadcast tidak ditemukan atau gagal dihapus' };
      }
      return { success: true, message: 'Siaran berhasil dihapus' };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message || 'Gagal menghapus siaran' };
    }
  });

export const broadcastModule = broadcastRouter;
