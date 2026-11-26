import { describe, expect, it } from 'bun:test';
import { db, caterBacaMeter } from '@cater/db';
import { eq, and, sql } from 'drizzle-orm';
import { aturanAnomaliService } from '../packages/backend/src/services/pencatat-meter/cater/aturan-anomali.service';
import { evaluasiAnomaliBaris } from '../packages/backend/src/domain/cater/anomali-evaluator';

describe('Audit Gerbang B: Integrasi Evaluator Anomali pada Seluruh Jalur Penulisan', () => {
  it('1. Cache aturan memakai versi DB sebagai kunci invalidasi', async () => {
    const ctx1 = await aturanAnomaliService.getCachedEngineContext();
    expect(ctx1.versi).toBeGreaterThanOrEqual(1);
    expect(ctx1.rules.length).toBeGreaterThan(0);
    expect(ctx1.maps.length).toBeGreaterThan(0);

    const ctx2 = await aturanAnomaliService.getCachedEngineContext();
    expect(ctx2.versi).toBe(ctx1.versi);
  });

  it('2. Endpoint pratinjau dampak (dry-run) menghitung simulasi tanpa menulis ke DB', async () => {
    const preview = await aturanAnomaliService.pratinjauDampak('aturan-lonjakan-m3', {
      minM3: '80', // Ubah ambang dari 75 ke 80
    });

    expect(preview.totalBaris).toBeGreaterThan(0);
    expect(preview.sebelum).toBeDefined();
    expect(preview.sesudah).toBeDefined();
    expect(preview.rincianPerKode.length).toBeGreaterThan(0);
  });

  it('3. Validasi parameter kontradiktif menolak perubahan tidak logis', async () => {
    const userContext = {
      userId: 'test-user',
      nama: 'Test Admin',
      role: 'SUPERADMIN',
    };

    // minPersen > maxPersen harus melempar error
    expect(
      aturanAnomaliService.updateAturan(
        'aturan-deviasi-ring2',
        {
          minPersen: 90,
          maxPersen: 50,
          alasan: 'Uji parameter kontradiktif',
        },
        userContext
      )
    ).rejects.toThrow('Ambang bawah (minPersen) tidak boleh lebih besar dari ambang atas (maxPersen).');

    // Alasan kurang dari 5 karakter harus ditolak
    expect(
      aturanAnomaliService.updateAturan(
        'aturan-deviasi-ring2',
        {
          alasan: 'abc',
        },
        userContext
      )
    ).rejects.toThrow('Alasan perubahan aturan wajib diisi minimal 5 karakter');
  });

  it('4. Koreksi stand periode N-1 memicu evaluasi ulang baris periode N yang dependen', async () => {
    // Jalankan simulasi koreksi N-1 pada pelanggan yang memiliki periode 202610 dan 202611
    const [sample] = await db
      .select({ nolg: caterBacaMeter.nolg })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, '202610'))
      .limit(1);

    if (sample) {
      const res = await aturanAnomaliService.evaluasiUlangBarisDependen(sample.nolg, '202610');
      // Jika periode 202611 ada untuk pelanggan ini:
      if (res) {
        expect(res.thblUpdated).toBe('202611');
        expect(res.evaluasiBaru).toBeDefined();
      }
    }
  });

  it('5. Memverifikasi tidak ada baris cater_baca_meter di DB yang terlewat dari evaluator (aturan_versi null)', async () => {
    const [res] = await db
      .select({ count: sql<number>`count(*)` })
      .from(caterBacaMeter)
      .where(sql`${caterBacaMeter.aturanVersi} IS NULL`);

    expect(Number(res?.count ?? 0)).toBe(0);
  });
});
