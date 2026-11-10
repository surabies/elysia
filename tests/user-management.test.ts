import { describe, expect, it } from 'bun:test';
import { masterExtendedService } from '../apps/web/src/server/services/master/master-extended.service';

describe('Manajemen Akun Pengguna & Hak Akses', () => {
  it('harus dapat mengambil daftar pengguna beserta peran dan statusnya', async () => {
    const users = await masterExtendedService.getDaftarUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);

    const first = users[0];
    expect(first.id).toBeDefined();
    expect(first.email).toBeDefined();
    expect(first.role).toBeDefined();
    expect(first.status).toBeDefined();
  });

  it('harus dapat memperbarui peran sistem dan status akun pengguna ke database', async () => {
    const users = await masterExtendedService.getDaftarUsers();
    const testUser = users.find((u) => u.email === 'demo@example.com') || users[0];
    expect(testUser).toBeDefined();

    const originalRole = testUser.role as any;
    const originalStatus = testUser.status;

    // Tes update peran ke STAFF_ADMIN_BILLING
    const targetRole = originalRole === 'STAFF_ADMIN_BILLING' ? 'VERIFIKATOR_1' : 'STAFF_ADMIN_BILLING';
    const targetStatus = originalStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';

    const updateRes = await masterExtendedService.updateUserRoleAndStatus(
      testUser.id,
      targetRole,
      targetStatus
    );
    expect(updateRes.success).toBe(true);

    // Ambil ulang dan pastikan berubah di database
    const refreshedUsers = await masterExtendedService.getDaftarUsers();
    const refreshed = refreshedUsers.find((u) => u.id === testUser.id);
    expect(refreshed?.role).toBe(targetRole);

    // Kembalikan ke semula
    await masterExtendedService.updateUserRoleAndStatus(
      testUser.id,
      originalRole,
      originalStatus
    );

    // Verifikasi kembali pulih
    const restoredUsers = await masterExtendedService.getDaftarUsers();
    const restored = restoredUsers.find((u) => u.id === testUser.id);
    expect(restored?.role).toBe(originalRole);
  });
});
