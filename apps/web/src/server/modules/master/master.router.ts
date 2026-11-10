import { Elysia, t } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import { masterPetugasService } from '../../services/master/master-petugas.service';
import { masterExtendedService } from '../../services/master/master-extended.service';

export const masterRouter = new Elysia({ prefix: '/master' })
  .use(authPlugin)

  // 1. Daftar seluruh petugas cater
  .get('/petugas', async () => {
    const data = await masterPetugasService.getDaftarPetugas();
    return { success: true, data };
  })

  // 2. Tambah petugas baru
  .post(
    '/petugas',
    async ({ body, set }) => {
      try {
        const result = await masterPetugasService.tambahPetugas(body);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        id: t.String({ minLength: 2 }),
        nama: t.String({ minLength: 2 }),
        noHp: t.Optional(t.String()),
        aktif: t.Optional(t.Boolean()),
      }),
    }
  )

  // 3. Update petugas
  .put(
    '/petugas/:id',
    async ({ params: { id }, body, set }) => {
      try {
        const result = await masterPetugasService.updatePetugas(id, body);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        nama: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        aktif: t.Optional(t.Boolean()),
      }),
    }
  )

  // 4. Daftar rute dan pemetaan penugasan
  .get('/pemetaan-petugas', async () => {
    const data = await masterPetugasService.getPemetaanRute();
    return { success: true, data };
  })

  // 5. Assign satu rute ke petugas
  .post(
    '/pemetaan-petugas/assign',
    async ({ body, set }) => {
      try {
        const result = await masterPetugasService.assignRute(
          body.ruteKode,
          body.petugasId ?? null
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        ruteKode: t.String(),
        petugasId: t.Nullable(t.String()),
      }),
    }
  )

  // 6. Batch assign rute ke petugas
  .post(
    '/pemetaan-petugas/batch-assign',
    async ({ body, set }) => {
      try {
        const result = await masterPetugasService.batchAssignRute(
          body.ruteKodes,
          body.petugasId ?? null
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        ruteKodes: t.Array(t.String()),
        petugasId: t.Nullable(t.String()),
      }),
    }
  )

  // 7. Ambil urutan langkah jalan rute
  .get(
    '/urut',
    async ({ query }) => {
      const ruteKode = (query as any)?.ruteKode ?? 'CD104';
      const data = await masterExtendedService.getUrutanRute(ruteKode);
      return { success: true, data };
    }
  )

  // 8. Simpan urutan langkah baru rute
  .post(
    '/urut',
    async ({ body, set }) => {
      try {
        const result = await masterExtendedService.simpanUrutanRute(
          body.ruteKode,
          body.items,
          body.periode ?? '202601'
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        ruteKode: t.String(),
        periode: t.Optional(t.String()),
        items: t.Array(
          t.Object({
            nolg: t.String(),
            urutan: t.Number(),
          })
        ),
      }),
    }
  )

  // 9. Master Kode Kelainan
  .get('/kelainan', async () => {
    const data = await masterExtendedService.getDaftarKelainan();
    return { success: true, data };
  })

  // 10. Update Kode Kelainan
  .put(
    '/kelainan/:kode',
    async ({ params: { kode }, body, set }) => {
      try {
        const result = await masterExtendedService.updateKelainan(kode, body);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: t.Object({ kode: t.String() }),
      body: t.Object({
        nama: t.Optional(t.String()),
        kategori: t.Optional(t.String()),
        deskripsi: t.Optional(t.Nullable(t.String())),
        aktif: t.Optional(t.Boolean()),
        isKendalaAkses: t.Optional(t.Boolean()),
        triggerBacaMandiri: t.Optional(t.Boolean()),
      }),
    }
  )

  // 11. Manajemen User
  .get('/users', async () => {
    const data = await masterExtendedService.getDaftarUsers();
    return { success: true, data };
  })

  // 11b. Update Peran & Status User (Hanya Superadmin & Otoritas Berwenang)
  .put(
    '/users/:id/role',
    async ({ params, body, set }: any) => {
      try {
        const result = await masterExtendedService.updateUserRoleAndStatus(
          params.id,
          body.role,
          body.status
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3'],
      body: t.Object({
        role: t.String(),
        status: t.Optional(t.Union([t.Literal('AKTIF'), t.Literal('NONAKTIF')])),
      }),
    }
  )

  // 12. Matriks Hak Akses RBAC
  .get('/otorisasi', async () => {
    const data = await masterExtendedService.getMatriksOtorisasi();
    return { success: true, data };
  })

  // 13. Update Matriks Hak Akses RBAC (Hanya Superadmin & Otoritas Berwenang)
  .put(
    '/otorisasi',
    async ({ body, user, set }: any) => {
      try {
        const result = await masterExtendedService.updateMatriksOtorisasi(
          body.items,
          user?.id
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3'],
      body: t.Object({
        items: t.Array(
          t.Object({
            id: t.Optional(t.String()),
            modulKey: t.String(),
            modulNama: t.Optional(t.String()),
            modul: t.Optional(t.String()),
            kategori: t.Optional(t.String()),
            deskripsi: t.Optional(t.String()),
            urutan: t.Optional(t.Number()),
            superadmin: t.Boolean(),
            staffBilling: t.Boolean(),
            verifikator1: t.Boolean(),
            verifikator2: t.Boolean(),
            verifikator3: t.Boolean(),
            executive: t.Boolean(),
            pelaksana: t.Boolean(),
          })
        ),
      }),
    }
  );
