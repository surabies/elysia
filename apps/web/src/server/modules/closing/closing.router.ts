import { Elysia } from 'elysia';
import type { AppRole } from '@cater/db';
import { authPlugin } from '../../plugins/auth';
import { closingService } from '../../services/closing/closing.service';
import { bulanBaruService } from '../../services/closing/bulan-baru.service';
import { pbpkService } from '../../services/closing/pbpk.service';
import {
  pratinjauParamsSchema,
  eksekusiClosingBodySchema,
  bukaBulanBaruBodySchema,
  postingDatameterBodySchema,
  verifikasiStandAngkatBodySchema,
  inputPasangBaruBodySchema,
  inputPerubahanKategoriBodySchema,
} from './closing.schema';

const CLOSING_AUTHORIZED_ROLES: ReadonlySet<AppRole> = new Set([
  'SUPERADMIN',
  'EXECUTIVE',
  'VERIFIKATOR_3',
  'VERIFIKATOR_2',
  'VERIFIKATOR_1',
  'STAFF_ADMIN_BILLING',
]);

function verifyClosingPermission(userRoles: AppRole[] | undefined): void {
  if (!userRoles || userRoles.length === 0) return;
  const hasPermission = userRoles.some((r) => CLOSING_AUTHORIZED_ROLES.has(r));
  if (!hasPermission) {
    throw new Error(
      'AKSES_DITOLAK: Akun Anda tidak memiliki wewenang untuk menjalankan proses tutup buku. Hubungi Supervisor atau Admin Billing; data tetap aman dan tidak berubah.'
    );
  }
}

export const closingRouter = new Elysia({ prefix: '/closing' })
  .use(authPlugin)

  // 0. Info Periode Kerja Aktif & Daftar Periode
  .get('/periode-kerja', async ({ set }) => {
    try {
      const result = await closingService.getPeriodeKerja();
      return { success: true, data: result };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })

  // 1. Evaluasi Status 12 Tahapan Alur Tutup Bulan
  .get(
    '/workflow-status/:periode',
    async ({ params: { periode }, set }) => {
      try {
        const result = await closingService.getWorkflowStages(periode);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: pratinjauParamsSchema,
    }
  )

  // 2. Pratinjau Kesiapan Closing Periode (Read-only simulation)
  .get(
    '/pratinjau/:periode',
    async ({ params: { periode }, set }) => {
      try {
        const preview = await closingService.pratinjauClosing(periode);
        return { success: true, data: preview };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: pratinjauParamsSchema,
    }
  )

  // 3. Eksekusi Penutupan Periode & Batch Penerbitan DRD
  .post(
    '/eksekusi',
    async ({ body, user, userRoles, set }: any) => {
      try {
        verifyClosingPermission(userRoles);
        const tanggalJatuhTempo = new Date(body.tanggalJatuhTempo);
        const result = await closingService.eksekusiClosing({
          periode: body.periode,
          tanggalJatuhTempo,
          userId: user?.name ?? user?.email ?? user?.id ?? 'ADMIN_BILLING',
        });

        return {
          success: true,
          message: `Tutup buku periode ${body.periode} berhasil diselesaikan dan dikunci.`,
          data: result,
        };
      } catch (err: any) {
        if (err.message?.startsWith('AKSES_DITOLAK:')) {
          set.status = 403;
        } else if (err.message?.includes('sudah ditutup')) {
          set.status = 409;
        } else {
          set.status = 400;
        }
        return { success: false, error: err.message };
      }
    },
    {
      body: eksekusiClosingBodySchema,
    }
  )

  // 4. Buka Bulan Baru (Inisialisasi DPM Periode N+1)
  .post(
    '/bulan-baru',
    async ({ body, user, userRoles, set }: any) => {
      try {
        verifyClosingPermission(userRoles);
        const result = await bulanBaruService.bukaBulanBaru({
          periodeLalu: body.periodeLalu,
          periodeBaru: body.periodeBaru,
          userId: user?.name ?? user?.email ?? user?.id ?? 'ADMIN_BILLING',
        });

        return {
          success: true,
          ...result,
        };
      } catch (err: any) {
        if (err.message?.startsWith('AKSES_DITOLAK:')) {
          set.status = 403;
        } else if (err.message?.includes('sudah pernah ditutup')) {
          set.status = 409;
        } else {
          set.status = 400;
        }
        return { success: false, error: err.message };
      }
    },
    {
      body: bukaBulanBaruBodySchema,
    }
  )

  // 5. Tahap 4: Posting Datameter Massal (Approve Final)
  .post(
    '/posting-datameter',
    async ({ body, user, userRoles, set }: any) => {
      try {
        verifyClosingPermission(userRoles);
        const result = await closingService.postingDatameterMassal(
          body.periode,
          user?.name ?? user?.email ?? user?.id ?? 'ADMIN_BILLING'
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = err.message?.startsWith('AKSES_DITOLAK:') ? 403 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: postingDatameterBodySchema,
    }
  )

  // 6. Tahap 11: Cek Selisih Pelanggan (Rekonsiliasi 4 Pilar)
  .get(
    '/cek-selisih/:periode',
    async ({ params: { periode }, set }) => {
      try {
        const result = await closingService.getCekSelisihPelanggan(periode);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: pratinjauParamsSchema,
    }
  )

  // 7. Tahap 6: Create Perbandingan Periode
  .get(
    '/perbandingan/:periode',
    async ({ params: { periode }, set }) => {
      try {
        const result = await closingService.getPerbandinganPeriode(periode);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: pratinjauParamsSchema,
    }
  )

  // 8. Tahap 2: Stand Angkat Mutasi List
  .get(
    '/stand-angkat/:periode',
    async ({ params: { periode }, set }) => {
      try {
        const result = await closingService.getStandAngkatMutasi(periode);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: pratinjauParamsSchema,
    }
  )

  // 9. Tahap 2: Verifikasi Mutasi Stand Angkat
  .post(
    '/stand-angkat/verifikasi',
    async ({ body, user, set }: any) => {
      try {
        const result = await closingService.verifikasiStandAngkat(
          body.id,
          user?.id ?? 'ADMIN_SYSTEM',
          body.status,
          body.catatan
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: verifikasiStandAngkatBodySchema,
    }
  )

  // 10. Tahap 1: PBPK Rekap Data
  .get(
    '/pbpk/:periode',
    async ({ params: { periode }, set }) => {
      try {
        const result = await pbpkService.getRekapPbpk(periode);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: pratinjauParamsSchema,
    }
  )

  // 11. Tahap 1: Input Pasang Baru (PB)
  .post(
    '/pbpk/pasang-baru',
    async ({ body, user, set }: any) => {
      try {
        const result = await pbpkService.inputPasangBaru({
          ...body,
          userId: user?.id ?? 'ADMIN_SYSTEM',
        });
        return { ...result, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: inputPasangBaruBodySchema,
    }
  )

  // 12. Tahap 1: Input Perubahan Kategori (PK)
  .post(
    '/pbpk/perubahan-kategori',
    async ({ body, user, set }: any) => {
      try {
        const result = await pbpkService.inputPerubahanKategori({
          ...body,
          userId: user?.id ?? 'ADMIN_SYSTEM',
        });
        return { ...result, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: inputPerubahanKategoriBodySchema,
    }
  )

  // 13. Tahap 3: Update Zonasi & Pemetaan Rute Otomatis
  .post(
    '/update-zonasi',
    async ({ body, set }) => {
      try {
        const result = await closingService.sinkronZonasiRute(body.periode);
        return { success: true, ...result, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: postingDatameterBodySchema,
    }
  )

  // 14. Tahap 8: Upload & Validasi Master Pelanggan
  .post(
    '/upload-master-pelanggan',
    async ({ body, set }) => {
      try {
        const result = await closingService.validasiUploadMasterPelanggan(body.periode);
        return { success: true, ...result, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: postingDatameterBodySchema,
    }
  )

  // 15. Tahap 9: Sync Pelanggan Baru ke Rute DPM
  .post(
    '/sync-pelanggan-baru',
    async ({ body, set }) => {
      try {
        const result = await closingService.syncPelangganBaruKeDpm(body.periode);
        return { success: true, ...result, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: postingDatameterBodySchema,
    }
  )

  // 16. Tahap 10: Update Data Pelanggan (Sequencing Urutan Rute)
  .post(
    '/update-data-pelanggan',
    async ({ body, set }) => {
      try {
        const result = await closingService.sequencingUrutanPelanggan(body.periode);
        return { success: true, ...result, data: result };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: postingDatameterBodySchema,
    }
  );
