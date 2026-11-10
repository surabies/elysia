import { describe, expect, it } from 'bun:test';
import { masterExtendedService } from '../apps/web/src/server/services/master/master-extended.service';

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

    // Modifikasi salah satu izin untuk tes update
    const sample = currentList[0];
    const prevValue = sample.staffBilling;
    const updatedSample = {
      ...sample,
      staffBilling: !prevValue,
    };

    const saved = await masterExtendedService.updateMatriksOtorisasi([updatedSample], 'test-admin');
    expect(saved).toBeDefined();

    // Verifikasi kembali dari database
    const refreshed = await masterExtendedService.getMatriksOtorisasi();
    const updatedInDb = refreshed.find((m) => m.modulKey === sample.modulKey);
    expect(updatedInDb?.staffBilling).toBe(!prevValue);

    // Kembalikan ke state semula
    await masterExtendedService.updateMatriksOtorisasi([{ ...sample, staffBilling: prevValue }], 'test-admin');
  });
});
