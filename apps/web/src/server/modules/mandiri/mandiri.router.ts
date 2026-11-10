import { Elysia, t } from 'elysia';
import { eq, and } from 'drizzle-orm';
import { db, caterMandiriPelanggan } from '@cater/db';
import { authPlugin } from '../../plugins/auth';
import { mandiriService } from '../../services/mandiri/mandiri.service';
import { submitMandiriPublicBodySchema, verifikasiMandiriBodySchema } from './mandiri.schema';

export const mandiriRouter = new Elysia({ prefix: '/cater/mandiri' })
  .use(authPlugin)

  /**
   * MODUL SEMENTARA TESTING (DAPAT DIHAPUS SETELAH UAT LULUS)
   * Menyediakan daftar periode uji yang dapat dipilih warga/tester di frontend
   * karena data seed database saat ini berada pada periode 202601 (Januari 2026).
   */
  .get('/public/periode-uji', async () => {
    return {
      success: true,
      data: {
        aktif: true,
        periodes: [202601, 202602],
        periodeDatabase: 202601,
        catatan:
          'MODUL SEMENTARA TESTING: Memungkinkan override periode lapor meter saat database berada di 202601. Hapus setelah UAT lulus.',
      },
    };
  })

  /**
   * MODUL SEMENTARA TESTING & STATUS
   * Mengambil status pelaporan mandiri pelanggan untuk periode tertentu.
   */
  .get(
    '/public/status/:nolg',
    async ({ params: { nolg }, query }) => {
      const thbl = query.thbl ?? '202601';
      const [laporan] = await db
        .select()
        .from(caterMandiriPelanggan)
        .where(
          and(
            eq(caterMandiriPelanggan.nolg, nolg),
            eq(caterMandiriPelanggan.thbl, thbl)
          )
        )
        .limit(1);

      return {
        success: true,
        data: laporan ?? null,
      };
    },
    {
      params: t.Object({ nolg: t.String() }),
      query: t.Object({ thbl: t.Optional(t.String()) }),
    }
  )

  // 1. Submit Lapor Mandiri oleh Pelanggan (Public Warga - Jendela 1-25 WIB)
  .post(
    '/public',
    async ({ body, set, request }) => {
      try {
        const ipAddress = request.headers.get('x-forwarded-for') ?? undefined;
        const userAgent = request.headers.get('user-agent') ?? undefined;

        const result = await mandiriService.submitLaporanMandiri({
          ...body,
          ipAddress,
          userAgent,
        });

        set.status = 201;
        return { success: true, data: result };
      } catch (err: any) {
        set.status = err.message.includes('ditutup') ? 403 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: submitMandiriPublicBodySchema,
    }
  )

  // 2. Verifikasi Laporan Mandiri oleh Petugas (Override DK -> Stand Konsumen)
  .post(
    '/verify',
    async ({ body, user, set }) => {
      try {
        const result = await mandiriService.verifikasiLaporanMandiri({
          ...body,
          userId: user!.id,
        });

        return { success: true, ...result };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['VERIFIKATOR_1', 'VERIFIKATOR_2', 'STAFF_ADMIN_BILLING'],
      body: verifikasiMandiriBodySchema,
    }
  );
