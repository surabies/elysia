import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { mandiriService } from '../../services/mandiri/mandiri.service';
import { submitMandiriPublicBodySchema, verifikasiMandiriBodySchema } from './mandiri.schema';

export const mandiriRouter = new Elysia({ prefix: '/cater/mandiri' })
  .use(authPlugin)

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
