import { Elysia, t } from 'elysia';
import { broadcastService } from '../../services/broadcast/broadcast.service';

export const broadcastRouter = new Elysia({ prefix: '/broadcast' })
  // 1. Ambil semua siaran (Dashboard Admin)
  .get('/', async () => {
    const data = await broadcastService.getAllBroadcasts();
    return {
      success: true,
      data,
    };
  })

  // 2. Ambil siaran aktif untuk konsumsi publik
  .get('/public', async () => {
    const data = await broadcastService.getPublicBroadcasts();
    return {
      success: true,
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

  // 7. Hapus broadcast
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
