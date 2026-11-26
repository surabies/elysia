import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { gwmService } from '../../services/gwm/gwm.service';
import {
  catatMutasiGantiMeterBodySchema,
  verifikasiMutasiBodySchema,
  catatDebitGwmBodySchema,
  neracaAirParamsSchema,
  daftarMutasiQuerySchema,
} from './gwm.schema';

export const gwmRouter = new Elysia({ prefix: '/cater/gwm' })
  .use(authPlugin)

  .get(
    '/mutasi',
    async ({ query }) => ({
      success: true,
      data: await gwmService.daftarMutasiGantiMeter(query.status as any),
    }),
    {
      requireRole: [
        'SUPERADMIN',
        'EXECUTIVE',
        'VERIFIKATOR_1',
        'VERIFIKATOR_2',
        'VERIFIKATOR_3',
        'STAFF_ADMIN_BILLING',
        'PENCATAT',
      ] as any,
      query: daftarMutasiQuerySchema,
    },
  )

  // 1. Input Berita Acara Penggantian Meter Air (Ganti Water Meter)
  .post(
    '/mutasi',
    async ({ body, set }) => {
      try {
        const result = await gwmService.catatMutasiGantiMeter(body as any);
        set.status = 201;
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: [
        'SUPERADMIN',
        'EXECUTIVE',
        'VERIFIKATOR_1',
        'VERIFIKATOR_2',
        'VERIFIKATOR_3',
        'STAFF_ADMIN_BILLING',
        'PENCATAT',
      ] as any,
      body: catatMutasiGantiMeterBodySchema,
    }
  )

  // 2. Verifikasi Ganti Meter oleh Supervisor (Perhitungan Stand Angkat & MB)
  .post(
    '/mutasi/verify',
    async ({ body, user, set }) => {
      try {
        const result = await gwmService.verifikasiMutasiGantiMeter({
          ...(body as any),
          userId: user?.id ?? 'ADMIN_SYSTEM',
        });
        return { success: true, data: result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: [
        'SUPERADMIN',
        'EXECUTIVE',
        'VERIFIKATOR_1',
        'VERIFIKATOR_2',
        'VERIFIKATOR_3',
        'STAFF_ADMIN_BILLING',
      ] as any,
      body: verifikasiMutasiBodySchema,
    }
  )

  // 3. Catat Pembacaan Debit Grand Water Meter (Meter Induk Zona DMA)
  .post(
    '/debit',
    async ({ body, set }) => {
      try {
        const result = await gwmService.catatDebitGwm(body);
        set.status = 201;
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['PENCATAT', 'VERIFIKATOR_1', 'STAFF_ADMIN_BILLING'],
      body: catatDebitGwmBodySchema,
    }
  )

  // 4. Monitoring Neraca Air & NRW Per Zona Distribusi
  .get(
    '/neraca-air/:zonaKode/:periode',
    async ({ params: { zonaKode, periode }, set }) => {
      try {
        const result = await gwmService.hitungNeracaAirZona(zonaKode, Number(periode));
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE'],
      params: neracaAirParamsSchema,
    }
  );
