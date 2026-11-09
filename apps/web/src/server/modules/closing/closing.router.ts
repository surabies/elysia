import { Elysia } from 'elysia';
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

export const closingRouter = new Elysia({ prefix: '/closing' })
  .use(authPlugin)

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
    async ({ body, user, set }: any) => {
      try {
        const tanggalJatuhTempo = new Date(body.tanggalJatuhTempo);
        const result = await closingService.eksekusiClosing({
          periode: body.periode,
          tanggalJatuhTempo,
          userId: user?.id ?? 'ADMIN_SYSTEM',
        });

        return {
          success: true,
          message: `Closing periode ${body.periode} berhasil dieksekusi.`,
          data: result,
        };
      } catch (err: any) {
        set.status = err.message.includes('sudah ditutup') ? 409 : 400;
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
    async ({ body, user, set }: any) => {
      try {
        const result = await bulanBaruService.bukaBulanBaru({
          periodeLalu: body.periodeLalu,
          periodeBaru: body.periodeBaru,
          userId: user?.id ?? 'ADMIN_SYSTEM',
        });

        return {
          success: true,
          ...result,
        };
      } catch (err: any) {
        set.status = err.message.includes('sudah ada') ? 409 : 400;
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
    async ({ body, user, set }: any) => {
      try {
        const result = await closingService.postingDatameterMassal(
          body.periode,
          user?.id ?? 'ADMIN_SYSTEM'
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 500;
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
        return { success: true, data: result };
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
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: inputPerubahanKategoriBodySchema,
    }
  );
