import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { caterKueriService } from '../../services/cater/cater-kueri.service';
import { caterVerifikasiService } from '../../services/cater/cater-verifikasi.service';
import { caterRuteService } from '../../services/cater/cater-rute.service';
import { pelangganService } from '../../services/pelanggan/pelanggan.service';
import { caterProgressService } from '../../services/cater/cater-progress.service';
import { mapService } from '../../services/geo/map.service';
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
  pindahRuteBodySchema,
  urutkanRuteBodySchema,
  gabungRuteBodySchema,
  cariPelangganQuerySchema,
  detailPelangganParamsSchema,
  updateKontakPelangganBodySchema,
  updateTarifPelangganBodySchema,
  thblParamsSchema,
  ikhtisarQuerySchema,
  mapGeoJsonQuerySchema,
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
        return { success: true, ...result, data: result.list };
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
  )

  // 11. Manajemen Rute - Pindah Rute Pelanggan (Menu 2.8)
  .post(
    '/rute/pindah',
    async ({ body, set }) => {
      try {
        const result = await caterRuteService.pindahRute(body);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2'],
      body: pindahRuteBodySchema,
    }
  )

  // 12. Manajemen Rute - Urutkan Sekuensial Pembacaan Rute (Menu 2.6)
  .post(
    '/rute/urutkan',
    async ({ body, set }) => {
      try {
        const result = await caterRuteService.urutkanRute(body);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2'],
      body: urutkanRuteBodySchema,
    }
  )

  // 13. Manajemen Rute - Penggabungan Rute (Menu 2.7)
  .post(
    '/rute/gabung',
    async ({ body, set }) => {
      try {
        const result = await caterRuteService.gabungRute(body);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2'],
      body: gabungRuteBodySchema,
    }
  )

  // 14. Pelanggan - Cari Cepat Pelanggan (Menu 3.2)
  .get(
    '/pelanggan/search',
    async ({ query, set }) => {
      try {
        const data = await pelangganService.searchPelanggan(query.q, query.limit);
        return { success: true, count: data.length, data };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE', 'PENCATAT'],
      query: cariPelangganQuerySchema,
    }
  )

  // 15. Pelanggan - Detail Profil & Histori (Menu 3.3)
  .get(
    '/pelanggan/:nolg',
    async ({ params: { nolg }, set }) => {
      try {
        const data = await pelangganService.getDetailPelanggan(nolg);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE', 'PENCATAT'],
      params: detailPelangganParamsSchema,
    }
  )

  // 16. Pelanggan - Update Nomor Kontak / WhatsApp (Menu 3.4)
  .patch(
    '/pelanggan/:nolg/kontak',
    async ({ params: { nolg }, body, set }) => {
      try {
        const result = await pelangganService.updateKontak(nolg, body.noTelp);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2'],
      params: detailPelangganParamsSchema,
      body: updateKontakPelangganBodySchema,
    }
  )

  // 17. Pelanggan - Mutasi Golongan Tarif (Menu 3.5)
  .patch(
    '/pelanggan/:nolg/tarif',
    async ({ params: { nolg }, body, set }) => {
      try {
        const result = await pelangganService.updateGolonganTarif(nolg, body.tarifKode);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_2', 'VERIFIKATOR_3'],
      params: detailPelangganParamsSchema,
      body: updateTarifPelangganBodySchema,
    }
  )

  // 18. Progress - Monitoring Per Wilayah / Seksi (Menu 5.2)
  .get(
    '/progress/wilayah/:thbl',
    async ({ params: { thbl }, set }) => {
      try {
        const data = await caterProgressService.getProgressPerWilayah(thbl);
        return { success: true, data };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE'],
      params: thblParamsSchema,
    }
  )

  // 19. Progress - Monitoring Produktivitas Cater (Menu 5.3)
  .get(
    '/progress/cater/:thbl',
    async ({ params: { thbl }, set }) => {
      try {
        const data = await caterProgressService.getProgressPerCater(thbl);
        return { success: true, data };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE'],
      params: thblParamsSchema,
    }
  )

  // 20. Progress - Ikhtisar Pemakaian Ekstrim > 100 m3 (Menu 5.5)
  .get(
    '/progress/ekstrim/:thbl',
    async ({ params: { thbl }, query, set }) => {
      try {
        const data = await caterProgressService.getIkhtisarEkstrim(thbl, query.limit);
        return { success: true, count: data.length, data };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE'],
      params: thblParamsSchema,
      query: ikhtisarQuerySchema,
    }
  )

  // 21. Progress - Ikhtisar Pemakaian 0 Kubik (Menu 5.7)
  .get(
    '/progress/pemakaian-nol/:thbl',
    async ({ params: { thbl }, query, set }) => {
      try {
        const data = await caterProgressService.getIkhtisarPemakaianNol(thbl, query.limit);
        return { success: true, count: data.length, data };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE'],
      params: thblParamsSchema,
      query: ikhtisarQuerySchema,
    }
  )

  // 22. Spasial - Visualisasi GeoJSON Peta Cater (Menu 6.1)
  .get(
    '/map/geojson',
    async ({ query, set }) => {
      try {
        const data = await mapService.getPelangganGeoJson(query.ruteKode, query.thbl);
        return data;
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'VERIFIKATOR_2', 'VERIFIKATOR_3', 'EXECUTIVE', 'PENCATAT'],
      query: mapGeoJsonQuerySchema,
    }
  );
