import { Elysia, t } from 'elysia';
import { CapaianService } from '../../services/cater/capaian.service';

export const capaianRouter = new Elysia({ prefix: '/capaian' })
  // 1. Ambil Keseluruhan Data Capaian (Tabel 1, Tabel 2, Ringkasan, Grafik)
  .get('/', async ({ query, set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    try {
      const wilayahId = (query?.wilayah as string) || '5';
      const tahun = query?.tahun ? parseInt(query.tahun as string, 10) : 2026;
      const data = await CapaianService.getCapaian(wilayahId, tahun);
      return { success: true, data };
    } catch (err: any) {
      set.status = err.statusCode || 500;
      return { success: false, error: err.message };
    }
  })

  // 2. Update Target Bulanan Individual (Inline Cell Edit)
  .put(
    '/target',
    async ({ body, set }) => {
      try {
        const data = await CapaianService.updateTarget(body);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.statusCode || 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        wilayahId: t.String(),
        tahun: t.Number(),
        bulan: t.Number({ minimum: 1, maximum: 12 }),
        targetSl: t.Number(),
        targetM3: t.Number(),
        versi: t.Optional(t.Number()),
        catatan: t.Optional(t.String()),
      }),
    }
  )

  // 3. Bulk Update Target Bulanan (Paste dari Excel)
  .put(
    '/target/bulk',
    async ({ body, set }) => {
      try {
        const data = await CapaianService.bulkUpdateTarget(body);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.statusCode || 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        wilayahId: t.String(),
        tahun: t.Number(),
        items: t.Array(
          t.Object({
            bulan: t.Number({ minimum: 1, maximum: 12 }),
            targetSl: t.Number(),
            targetM3: t.Number(),
          })
        ),
      }),
    }
  )

  // 4. Update Realisasi Bulanan Manual
  .put(
    '/realisasi',
    async ({ body, set }) => {
      try {
        const data = await CapaianService.updateRealisasi(body);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.statusCode || 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        wilayahId: t.String(),
        tahun: t.Number(),
        bulan: t.Number({ minimum: 0, maximum: 12 }),
        realisasiSl: t.Number(),
        realisasiM3: t.Number(),
        sumber: t.Optional(t.Union([t.Literal('MANUAL'), t.Literal('OTOMATIS')])),
        dikunci: t.Optional(t.Boolean()),
      }),
    }
  )

  // 5. Sinkronisasi Ulang Otomatis dari Database Transaksi
  .post(
    '/sync',
    async ({ body, set }) => {
      try {
        const payload = (body as { wilayahId?: string; tahun?: number } | undefined) ?? {};
        const wilayahId = payload.wilayahId || '5';
        const tahun = payload.tahun || 2026;
        const data = await CapaianService.syncOtomatis(wilayahId, tahun);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.statusCode || 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Optional(
        t.Object({
          wilayahId: t.Optional(t.String()),
          tahun: t.Optional(t.Number()),
        })
      ),
    }
  )

  // 6. Update Pengaturan (e.g. Hari Acuan LPS)
  .put(
    '/pengaturan',
    async ({ body, set }) => {
      try {
        const data = await CapaianService.updatePengaturan(body);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.statusCode || 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        wilayahId: t.String(),
        tahun: t.Number(),
        hariAcuanLps: t.Number({ minimum: 1, maximum: 365 }),
      }),
    }
  )

  // 7. Ambil Riwayat Perubahan (Audit Log)
  .get('/riwayat', async ({ query, set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    try {
      const wilayahId = (query?.wilayah as string) || '5';
      const tahun = query?.tahun ? parseInt(query.tahun as string, 10) : 2026;
      const data = await CapaianService.getRiwayat(wilayahId, tahun);
      return { success: true, data };
    } catch (err: any) {
      set.status = err.statusCode || 500;
      return { success: false, error: err.message };
    }
  });
