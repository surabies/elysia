import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { caterKueriService } from '../../services/cater/cater-kueri.service';
import { caterVerifikasiService } from '../../services/cater/cater-verifikasi.service';
import {
  routesQuerySchema,
  routePelangganParamsSchema,
  routePelangganQuerySchema,
  submitReadingBodySchema,
  anomaliesQuerySchema,
  historyParamsSchema,
  verifyV1BodySchema,
  verifyV2BodySchema,
  verifyV3BodySchema,
  staffCorrectionBodySchema,
} from './cater.schema';

/**
 * Cater Router: Menangani endpoint HTTP /api/cater/*
 * Menerapkan Separation of Concerns: Hanya validasi TypeBox, RBAC guard, dan delegasi ke Service.
 */
export const caterRouter = new Elysia({ prefix: '/cater' })
  .use(authPlugin)

  // 1. Dashboard Overview Stats
  .get('/stats', async () => {
    try {
      const stats = await caterKueriService.getStats();
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  })

  // 2. Daftar Rute Petugas
  .get(
    '/routes',
    async ({ query }) => {
      try {
        const routes = await caterKueriService.getRoutes(query.limit, query.offset);
        return { success: true, data: routes };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    {
      query: routesQuerySchema,
    }
  )

  // 3. Unduh Beban Kerja Rute (Mobile Offline Sync)
  .get(
    '/routes/:kode/pelanggan',
    async ({ params, query }) => {
      try {
        const result = await caterKueriService.getRoutePelanggan(params.kode, query.limit);
        return { success: true, ...result };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    {
      params: routePelangganParamsSchema,
      query: routePelangganQuerySchema,
    }
  )

  // 4. Submit Pembacaan Meter (Aplikasi Mobile Petugas)
  .post(
    '/readings',
    async ({ body, set }) => {
      try {
        const result = await caterVerifikasiService.submitReading(body);
        set.status = 201;
        return {
          success: true,
          message: 'Meter reading recorded successfully',
          data: result,
        };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: submitReadingBodySchema,
    }
  )

  // 5. Daftar Anomali untuk Supervisor
  .get(
    '/anomalies',
    async ({ query }) => {
      try {
        const anomalies = await caterKueriService.getAnomalies(query.limit);
        return { success: true, count: anomalies.length, data: anomalies };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    {
      query: anomaliesQuerySchema,
    }
  )

  // 6. Riwayat Audit Log Verifikasi
  .get(
    '/history/:caterId',
    async ({ params, set }) => {
      try {
        const logs = await caterKueriService.getAuditHistory(params.caterId);
        return { success: true, data: logs };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: historyParamsSchema,
    }
  )

  // 7. Verifikasi V1 - Supervisor Seksi / Rute
  .post(
    '/verify/v1',
    async ({ body, user, set }) => {
      try {
        const result = await caterVerifikasiService.verifikasiV1(body, user!.id);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['VERIFIKATOR_1'],
      body: verifyV1BodySchema,
    }
  )

  // 8. Verifikasi V2 - Manager Cabang / Wilayah
  .post(
    '/verify/v2',
    async ({ body, user, set }) => {
      try {
        const result = await caterVerifikasiService.verifikasiV2(body, user!.id);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('wajib diisi') ? 400 : err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['VERIFIKATOR_2'],
      body: verifyV2BodySchema,
    }
  )

  // 9. Verifikasi V3 - Senior Manager / Direksi (Final Approval)
  .post(
    '/verify/v3',
    async ({ body, user, set }) => {
      try {
        const result = await caterVerifikasiService.verifikasiV3(body, user!.id);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['VERIFIKATOR_3', 'EXECUTIVE'],
      body: verifyV3BodySchema,
    }
  )

  // 10. Koreksi Administratif Pasca-Verifikasi oleh Staff
  .post(
    '/staff/correct',
    async ({ body, user, set }) => {
      try {
        const result = await caterVerifikasiService.koreksiStaff(body, user!.id);
        return { success: true, ...result };
      } catch (err: any) {
        if (err.message.includes('tidak aktif') || err.message.includes('belum pernah diverifikasi')) {
          set.status = 400;
        } else if (err.message.includes('terkunci')) {
          set.status = 403;
        } else if (err.message.includes('tidak ditemukan')) {
          set.status = 404;
        } else {
          set.status = 500;
        }
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING'],
      body: staffCorrectionBodySchema,
    }
  );
