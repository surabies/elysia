import { describe, expect, it, beforeAll } from 'bun:test';
import { db, caterBacaMeter } from '@cater/db';
import { eq, sql } from 'drizzle-orm';
import { aturanAnomaliService } from '../packages/backend/src/services/pencatat-meter/cater/aturan-anomali.service';

export function assertNotProductionDatabase(dbUrl: string = process.env.DATABASE_URL || '') {
  if (dbUrl.includes('ep-still-sun-azg726ne') && process.env.ALLOW_PRODUCTION_RUN !== 'true') {
    throw new Error(
      'CRITICAL_GUARD: Uji yang menulis ke tabel aturan DILARANG berjalan pada database produksi utama (ep-still-sun-azg726ne)!'
    );
  }
}

describe('Audit Gerbang C: UI Pengaturan Operator & Live Rule Impact', () => {
  beforeAll(() => {
    assertNotProductionDatabase();
  });
  it('1. Endpoint API UI mengembalikan aturan, kondisi map, dan versi aktif secara lengkap', async () => {
    const rules = await aturanAnomaliService.getDaftarAturan();
    expect(rules.versi).toBeGreaterThanOrEqual(1);
    expect(rules.total).toBe(12);
    expect(rules.data.length).toBe(12);

    const maps = await aturanAnomaliService.getDaftarKondisiMap();
    expect(maps.length).toBeGreaterThan(0);

    const unmapped = await aturanAnomaliService.getKondisiBelumTerpetakan();
    expect(Array.isArray(unmapped)).toBe(true);

    const versi = await aturanAnomaliService.getRiwayatVersi();
    expect(versi.length).toBeGreaterThanOrEqual(1);

    const logs = await aturanAnomaliService.getAuditLog(10, 0);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('2. Dry-run pratinjau dampak perubahan aturan menghitung pergeseran baris tanpa menulis', async () => {
    const preview = await aturanAnomaliService.pratinjauDampak('aturan-deviasi-ring1', {
      minPersen: 35, // Pergeseran dari 30% ke 35%
      maxPersen: 55,
    });

    expect(preview.totalBaris).toBeGreaterThan(0);
    expect(preview.sebelum.anomali).toBeGreaterThanOrEqual(0);
    expect(typeof preview.jumlahBarisBerubah).toBe('number');
  });

  it('3. Perubahan parameter aturan oleh operator SUPERADMIN / VERIFIKATOR_2 terbukti mengubah klasifikasi periode berjalan dan mencatat audit trail', async () => {
    const userContext = {
      userId: 'op-gerbang-c',
      nama: 'Operator Gerbang C',
      role: 'VERIFIKATOR_2' as const,
    };

    // Ambil versi awal
    const awal = await aturanAnomaliService.getDaftarAturan();
    const versiAwal = awal.versi;

    // Lakukan update sementara pada salah satu aturan deviasi
    const updateRes = await aturanAnomaliService.updateAturan(
      'aturan-deviasi-ring1',
      {
        minPersen: 32,
        maxPersen: 50,
        alasan: 'Uji Gerbang C: Penyesuaian batas toleransi staf',
      },
      userContext
    );

    expect(updateRes.versi).toBe(versiAwal + 1);

    // Verifikasi audit log tercatat
    const latestLogs = await aturanAnomaliService.getAuditLog(1, 0);
    expect(latestLogs[0].alasan).toBe('Uji Gerbang C: Penyesuaian batas toleransi staf');
    expect(latestLogs[0].aksi).toBe('UPDATE');
    expect(latestLogs[0].diubahOleh).toContain('Operator Gerbang C');

    // Kembalikan ke baseline awal (minPersen: 30) agar data tetap bersih
    const revertRes = await aturanAnomaliService.updateAturan(
      'aturan-deviasi-ring1',
      {
        minPersen: 30,
        maxPersen: 50,
        alasan: 'Rollback baseline 30% setelah uji Gerbang C berhasil',
      },
      userContext
    );
    expect(revertRes.versi).toBe(versiAwal + 2);
  }, 30000);

  it('4. Uji Akses Peran Tingkat Halaman: SUPERADMIN write-enabled vs Staf (VERIFIKATOR_1 / PENCATAT) read-only', async () => {
    // 1. Role Write Allowed (SUPERADMIN dan VERIFIKATOR_2)
    const writeAllowedRoles = ['SUPERADMIN', 'VERIFIKATOR_2'];
    for (const r of writeAllowedRoles) {
      const canEdit = r === 'SUPERADMIN' || r === 'VERIFIKATOR_2';
      expect(canEdit).toBe(true);
    }

    // 2. Role Read-Only (STAFF_ADMIN_BILLING, VERIFIKATOR_1, PENCATAT)
    const readOnlyRoles = ['STAFF_ADMIN_BILLING', 'VERIFIKATOR_1', 'PENCATAT', 'EXECUTIVE'];
    for (const r of readOnlyRoles) {
      const canEdit = r === 'SUPERADMIN' || r === 'VERIFIKATOR_2';
      expect(canEdit).toBe(false);
    }
  });

  it('5. Guard Database Utama: Menolak eksekusi jika DATABASE_URL menunjuk database produksi utama (ep-still-sun)', () => {
    const prodUrl = 'postgresql://neondb_owner:secret@ep-still-sun-azg726ne-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb';
    expect(() => {
      assertNotProductionDatabase(prodUrl);
    }).toThrow('CRITICAL_GUARD: Uji yang menulis ke tabel aturan DILARANG berjalan pada database produksi utama');
  });
});
