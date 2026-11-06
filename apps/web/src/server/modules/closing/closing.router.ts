import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { closingService } from '../../services/closing/closing.service';
import { pratinjauParamsSchema, eksekusiClosingBodySchema } from './closing.schema';

export const closingRouter = new Elysia({ prefix: '/closing' })
  .use(authPlugin)

  // 1. Pratinjau Kesiapan Closing Periode (Read-only simulation)
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
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_2', 'EXECUTIVE'],
      params: pratinjauParamsSchema,
    }
  )

  // 2. Eksekusi Penutupan Periode & Batch Penerbitan DRD
  .post(
    '/eksekusi',
    async ({ body, user, set }: { body: { periode: string; tanggalJatuhTempo: string }; user: any; set: any }) => {
      try {
        const tanggalJatuhTempo = new Date(body.tanggalJatuhTempo);
        const result = await closingService.eksekusiClosing({
          periode: body.periode,
          tanggalJatuhTempo,
          userId: user!.id,
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
      requireRole: ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_2'],
      body: eksekusiClosingBodySchema,
    }
  );
