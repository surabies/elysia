import { Elysia, t } from 'elysia';
import type { AppRole } from '@cater/db';
import { authPlugin } from "@cater/backend/plugins/auth";
import { aturanAnomaliService } from "@/server/services/cater/aturan-anomali.service";

const ATURAN_READ_ROLES: AppRole[] = [
  'SUPERADMIN',
  'EXECUTIVE',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_1',
  'VERIFIKATOR_2',
  'VERIFIKATOR_3',
];

const ATURAN_WRITE_ROLES: AppRole[] = [
  'SUPERADMIN',
  'VERIFIKATOR_2',
];

export const aturanAnomaliRouter = new Elysia({ prefix: '/aturan-anomali' })
  .use(authPlugin)

  // 1. Baca Aturan (Tersedia untuk seluruh peran verifikasi & manajerial)
  .guard({
    requireRole: ATURAN_READ_ROLES,
  })
  .get('/', async ({ set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    const result = await aturanAnomaliService.getDaftarAturan();
    return { success: true, ...result };
  })

  .get('/versi', async ({ set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    const data = await aturanAnomaliService.getRiwayatVersi();
    return { success: true, data };
  })

  .get('/audit-log', async ({ query, set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    const limit = query?.limit ? Number(query.limit) : 50;
    const offset = query?.offset ? Number(query.offset) : 0;
    const data = await aturanAnomaliService.getAuditLog(limit, offset);
    return { success: true, data };
  })

  .get('/kondisi-map', async ({ set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    const data = await aturanAnomaliService.getDaftarKondisiMap();
    return { success: true, data };
  })

  .get('/kondisi-unmapped', async ({ set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    const data = await aturanAnomaliService.getKondisiBelumTerpetakan();
    return { success: true, data };
  })

  .get('/:id', async ({ params: { id }, set }) => {
    set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
    set.headers['Pragma'] = 'no-cache';
    const data = await aturanAnomaliService.getAturanById(id);
    if (!data) {
      set.status = 404;
      return { success: false, error: 'Aturan anomali tidak ditemukan.' };
    }
    return { success: true, data };
  })

  // 2. Pratinjau Dampak (Dry-Run / Preview Sebelum Simpan)
  .post(
    '/:id/pratinjau',
    async ({ params: { id }, body, set }) => {
      try {
        const result = await aturanAnomaliService.pratinjauDampak(
          id,
          body.perubahan as any,
          body.periode
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        perubahan: t.Record(t.String(), t.Any()),
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 2b. Alias Pratinjau Dampak (/simulasi-dampak)
  .post(
    '/simulasi-dampak',
    async ({ body, set }) => {
      try {
        const ruleId = (body as any).ruleId || (body as any).id;
        const perubahan = (body as any).params || (body as any).perubahan || {};
        const result = await aturanAnomaliService.pratinjauDampak(
          ruleId,
          perubahan as any,
          (body as any).periode
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        ruleId: t.Optional(t.String()),
        id: t.Optional(t.String()),
        params: t.Optional(t.Record(t.String(), t.Any())),
        perubahan: t.Optional(t.Record(t.String(), t.Any())),
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 3. Mutasi Aturan (Khusus SUPERADMIN dan VERIFIKATOR_2)
  .guard({
    requireRole: ATURAN_WRITE_ROLES,
  })
  .put(
    '/:id',
    async ({ params: { id }, body, user, set }) => {
      try {
        const userContext = {
          userId: user?.id || 'system',
          nama: user?.name || 'Operator',
          role: ((user as any)?.role as any) || 'SUPERADMIN',
        };

        const result = await aturanAnomaliService.updateAturan(id, body as any, userContext);
        return { ...result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        nama: t.Optional(t.String()),
        arah: t.Optional(t.String()),
        acuanPembanding: t.Optional(t.String()),
        periodeHistorisJml: t.Optional(t.Number()),
        syaratPakaiLaluMinM3: t.Optional(t.Nullable(t.Number())),
        selisihMinM3: t.Optional(t.Nullable(t.Number())),
        minM3: t.Optional(t.Nullable(t.Number())),
        maxM3: t.Optional(t.Nullable(t.Number())),
        minPersen: t.Optional(t.Nullable(t.Number())),
        maxPersen: t.Optional(t.Nullable(t.Number())),
        dihitungSebagaiAnomali: t.Optional(t.Boolean()),
        ringTingkat: t.Optional(t.Number()),
        tingkatKeparahan: t.Optional(t.String()),
        badgeTone: t.Optional(t.String()),
        urutan: t.Optional(t.Number()),
        syaratKondisiLalu: t.Optional(t.String()),
        syaratPeriodeBerturut: t.Optional(t.Nullable(t.Number())),
        kecualikanJikaBerlanjut: t.Optional(t.Boolean()),
        kecualikanJikaPakaiLaluDibawah: t.Optional(t.Nullable(t.Number())),
        deskripsi: t.Optional(t.String()),
        alasan: t.String({ minLength: 5 }), // Alasan wajib ada
      }),
    }
  )

  .patch(
    '/:id/toggle',
    async ({ params: { id }, body, user, set }) => {
      try {
        const userContext = {
          userId: user?.id || 'system',
          nama: user?.name || 'Operator',
          role: ((user as any)?.role as any) || 'SUPERADMIN',
        };

        const result = await aturanAnomaliService.toggleAktifAturan(
          id,
          body.aktif,
          body.alasan,
          userContext
        );
        return { ...result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        aktif: t.Boolean(),
        alasan: t.String({ minLength: 5 }), // Alasan wajib ada
      }),
    }
  )

  // 3b. Alias Mutasi Aturan (/simpan)
  .post(
    '/simpan',
    async ({ body, user, set }) => {
      try {
        const userContext = {
          userId: user?.id || 'system',
          nama: user?.name || 'Operator',
          role: ((user as any)?.role as any) || 'SUPERADMIN',
        };
        const ruleId = (body as any).ruleId || (body as any).id;
        const params = (body as any).params || body;
        const result = await aturanAnomaliService.updateAturan(
          ruleId,
          {
            ...params,
            alasan: (body as any).alasan,
          },
          userContext
        );
        return { ...result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        ruleId: t.Optional(t.String()),
        id: t.Optional(t.String()),
        alasan: t.String({ minLength: 5 }),
        params: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  )

  // 3c. Alias Toggle Aktif (/:id/toggle-aktif)
  .patch(
    '/:id/toggle-aktif',
    async ({ params: { id }, body, user, set }) => {
      try {
        const userContext = {
          userId: user?.id || 'system',
          nama: user?.name || 'Operator',
          role: ((user as any)?.role as any) || 'SUPERADMIN',
        };
        const alasan = (body as any).alasan || `Toggle status aturan ${id}`;
        const result = await aturanAnomaliService.toggleAktifAturan(
          id,
          (body as any).aktif,
          alasan,
          userContext
        );
        return { ...result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        aktif: t.Boolean(),
        alasan: t.Optional(t.String()),
      }),
    }
  );
