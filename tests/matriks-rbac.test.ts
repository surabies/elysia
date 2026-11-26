import { describe, expect, it } from 'bun:test';
import { masterExtendedService } from '../packages/backend/src/services/langganan/master/master-extended.service';

describe('Matriks Hak Akses & Ring Approval (RBAC)', () => {
  it('harus dapat mengambil matriks hak akses dan menginisialisasi default jika kosong', async () => {
    const list = await masterExtendedService.getMatriksOtorisasi();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(11);
    
    // Pastikan field penting ada
    const monitoring = list.find((m) => m.modulKey === 'monitoring_gis');
    expect(monitoring).toBeDefined();
    expect(monitoring?.modulNama).toBe('GIS & Monitoring Cater');
    expect(monitoring?.superadmin).toBe(true);
  });

  it('harus dapat menyimpan perubahan matriks hak akses', async () => {
    const currentList = await masterExtendedService.getMatriksOtorisasi();
    expect(currentList.length).toBeGreaterThan(0);

    // Modifikasi salah satu izin untuk tes update (gunakan manual_add agar tidak mengganggu monitoring_gis)
    const sample = currentList.find((m) => m.modulKey === 'manual_add') || currentList[0];
    const prevValue = sample.staff;
    const updatedSample = {
      ...sample,
      staff: !prevValue,
      staffBilling: !prevValue,
    };

    const saved = await masterExtendedService.updateMatriksOtorisasi([updatedSample], 'test-admin');
    expect(saved).toBeDefined();

    // Verifikasi kembali dari database
    const refreshed = await masterExtendedService.getMatriksOtorisasi();
    const updatedInDb = refreshed.find((m) => m.modulKey === sample.modulKey);
    expect(updatedInDb?.staff).toBe(!prevValue);

    // Kembalikan ke state semula
    await masterExtendedService.updateMatriksOtorisasi(
      [{ ...sample, staff: prevValue, staffBilling: prevValue }],
      'test-admin'
    );
  });

  it('harus memuat 6 tingkatan jabatan resmi (Direksi, Senior Manager, Manager, Supervisor, Staff, Pelaksana)', async () => {
    const list = await masterExtendedService.getMatriksOtorisasi();
    const gis = list.find((m) => m.modulKey === 'monitoring_gis');
    expect(gis).toBeDefined();
    expect(gis?.direksi).toBe(true);
    expect(gis?.seniorManager).toBe(true);
    expect(gis?.manager).toBe(true);
    expect(gis?.supervisor).toBe(true);
    expect(gis?.staff).toBe(true);
    expect(gis?.pelaksana).toBe(true);

    const ring3 = list.find((m) => m.modulKey === 'verif_ring3');
    expect(ring3).toBeDefined();
    expect(ring3?.direksi).toBe(true);
    expect(ring3?.seniorManager).toBe(true);
    expect(ring3?.manager).toBe(false);
    expect(ring3?.supervisor).toBe(false);
    expect(ring3?.staff).toBe(false);
    expect(ring3?.pelaksana).toBe(false);
  });

  it('harus mendukung kustomisasi hak akses perorangan (User Permission Override untuk Si A)', async () => {
    const dummyUserId = 'test-si-a-' + Date.now();

    // 1. Dapatkan izin awal (User baru tanpa role = roleDefault false untuk verif_ring3)
    const initialPerms = await masterExtendedService.getUserEffectivePermissions(dummyUserId);
    const ring3Initial = initialPerms.find((p) => p.modulKey === 'verif_ring3');
    expect(ring3Initial?.effectiveGranted).toBe(false);
    expect(ring3Initial?.isOverridden).toBe(false);

    // 2. Berikan override khusus: Si A boleh melakukan verif_ring3
    const setResult = await masterExtendedService.setUserPermissionOverrides(
      dummyUserId,
      [
        {
          modulKey: 'verif_ring3',
          granted: true,
          catatan: 'Diberikan wewenang pelaksana khusus oleh Direksi',
        },
      ]
    );
    expect(setResult.success).toBe(true);
    expect(setResult.count).toBe(1);

    // 3. Verifikasi ulang izin efektif: Sekarang Si A punya izin verif_ring3 = true
    const updatedPerms = await masterExtendedService.getUserEffectivePermissions(dummyUserId);
    const ring3Updated = updatedPerms.find((p) => p.modulKey === 'verif_ring3');
    expect(ring3Updated?.effectiveGranted).toBe(true);
    expect(ring3Updated?.isOverridden).toBe(true);
    expect(ring3Updated?.overrideCatatan).toContain('pelaksana khusus');

    // 4. Verifikasi via helper cepat hasUserPermission
    const canDoRing3 = await masterExtendedService.hasUserPermission(dummyUserId, 'verif_ring3');
    expect(canDoRing3).toBe(true);

    // 5. Reset override: Cabut izin khusus, harus kembali ke default role
    await masterExtendedService.resetUserPermissionOverride(dummyUserId, 'verif_ring3');
    const resetPerms = await masterExtendedService.getUserEffectivePermissions(dummyUserId);
    const ring3Reset = resetPerms.find((p) => p.modulKey === 'verif_ring3');
    expect(ring3Reset?.effectiveGranted).toBe(false);
    expect(ring3Reset?.isOverridden).toBe(false);
  });
});
