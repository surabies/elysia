import { Elysia, t } from 'elysia';
import type { AppRole } from '@cater/db';
import { authPlugin } from '../../plugins/auth';
import { masterPetugasService } from '../../services/master/master-petugas.service';
import { masterExtendedService } from '../../services/master/master-extended.service';

const MASTER_READ_ROLES: AppRole[] = [
  'SUPERADMIN',
  'EXECUTIVE',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_1',
  'VERIFIKATOR_2',
  'VERIFIKATOR_3',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
];

const MASTER_WRITE_ROLES: AppRole[] = [
  'SUPERADMIN',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_1',
  'VERIFIKATOR_2',
  'VERIFIKATOR_3',
  'DIREKSI',
  'SENIOR_MANAGER',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
];

export const masterRouter = new Elysia({ prefix: '/master' })
  .use(authPlugin)
  .guard({
    requireRole: MASTER_READ_ROLES,
  })

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
          body.petugasId ?? null,
          body.statusSementara ?? false
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
        statusSementara: t.Optional(t.Boolean()),
      }),
    }
  )

  // 5b. Update urutan rute baca petugas
  .post(
    '/pemetaan-petugas/urutan-rute',
    async ({ body, set }) => {
      try {
        const result = await masterPetugasService.updateUrutanRutePetugas(body.items);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            ruteKode: t.String(),
            noUrut: t.Number(),
          })
        ),
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
          body.periode ?? '202611'
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

  // 11. Manajemen User (Hanya Superadmin & Otoritas Berwenang)
  .get(
    '/users',
    async () => {
      const data = await masterExtendedService.getDaftarUsers();
      return { success: true, data };
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
    }
  )

  // 11b. Update Peran & Status User (Hanya Superadmin & Otoritas Berwenang)
  .put(
    '/users/:id/role',
    async ({ params, body, set }: any) => {
      try {
        const result = await masterExtendedService.updateUserRoleAndStatus(
          params.id,
          body.role,
          body.status,
          {
            bagian: body.bagian,
            wilayahKerja: body.wilayahKerja,
            jabatanNama: body.jabatanNama,
            unitKerja: body.unitKerja,
            level: body.level,
          }
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
      body: t.Object({
        role: t.String(),
        status: t.Optional(t.Union([t.Literal('AKTIF'), t.Literal('NONAKTIF')])),
        bagian: t.Optional(t.String()),
        wilayahKerja: t.Optional(t.String()),
        jabatanNama: t.Optional(t.String()),
        unitKerja: t.Optional(t.String()),
        level: t.Optional(t.String()),
      }),
    }
  )

  // 11c. Tambah Pengguna Baru (Hanya Superadmin & Direksi)
  .post(
    '/users',
    async ({ body, set }: any) => {
      try {
        const result = await masterExtendedService.createUser(body);
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'DIREKSI'],
      body: t.Object({
        name: t.String({ minLength: 2 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        role: t.String(),
        roles: t.Optional(t.Array(t.String())),
        nip: t.Optional(t.String()),
        level: t.Optional(t.String()),
        bagian: t.Optional(t.String()),
        wilayahKerja: t.Optional(t.String()),
        jabatanNama: t.Optional(t.String()),
        unitKerja: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        wajibGantiPassword: t.Optional(t.Boolean()),
      }),
    }
  )

  // 12. Matriks Hak Akses RBAC
  .get(
    '/otorisasi',
    async () => {
      const data = await masterExtendedService.getMatriksOtorisasi();
      return { success: true, data };
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
    }
  )

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
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
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
            superadmin: t.Optional(t.Boolean()),
            direksi: t.Optional(t.Boolean()),
            seniorManager: t.Optional(t.Boolean()),
            manager: t.Optional(t.Boolean()),
            supervisor: t.Optional(t.Boolean()),
            staff: t.Optional(t.Boolean()),
            pelaksana: t.Optional(t.Boolean()),
            // Legacy perizinan
            staffBilling: t.Optional(t.Boolean()),
            verifikator1: t.Optional(t.Boolean()),
            verifikator2: t.Optional(t.Boolean()),
            verifikator3: t.Optional(t.Boolean()),
            executive: t.Optional(t.Boolean()),
          })
        ),
      }),
    }
  )

  // 14. Ambil Izin Efektif Pengguna (Termasuk Custom Override Si A)
  .get(
    '/users/:id/hak-akses',
    async ({ params, set }: any) => {
      try {
        const data = await masterExtendedService.getUserEffectivePermissions(params.id);
        return { success: true, data };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
    }
  )

  // 15. Simpan / Perbarui Override Hak Akses Pengguna (Kustomisasi Si A)
  .put(
    '/users/:id/hak-akses',
    async ({ params, body, user, set }: any) => {
      try {
        const result = await masterExtendedService.setUserPermissionOverrides(
          params.id,
          body.overrides,
          user?.id
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
      body: t.Object({
        overrides: t.Array(
          t.Object({
            modulKey: t.String(),
            granted: t.Optional(t.Boolean()),
            canRead: t.Optional(t.Boolean()),
            canCreate: t.Optional(t.Boolean()),
            canUpdate: t.Optional(t.Boolean()),
            canDelete: t.Optional(t.Boolean()),
            canPost: t.Optional(t.Boolean()),
            catatan: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  // 16. Reset Override Hak Akses Pengguna ke Bawaan Role
  .delete(
    '/users/:id/hak-akses/:modulKey',
    async ({ params, set }: any) => {
      try {
        const result = await masterExtendedService.resetUserPermissionOverride(
          params.id,
          params.modulKey
        );
        return { success: true, data: result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      requireRole: ['SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'DIREKSI', 'SENIOR_MANAGER'],
    }
  );
