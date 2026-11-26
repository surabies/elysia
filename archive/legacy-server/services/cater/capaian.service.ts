import { eq, and, sql, desc } from 'drizzle-orm';
import {
  db,
  capaianTargetBulanan,
  capaianRealisasiBulanan,
  capaianPengaturan,
  capaianRiwayat,
  caterBacaMeter,
} from '@cater/db';
import {
  prosesHitungCapaian,
} from '../../domain/capaian/capaian.engine';
import {
  TargetBulananItem,
  RealisasiBulananItem,
  PengaturanCapaian,
  CapaianPayloadLengkap,
} from '../../domain/capaian/capaian.types';

export class CapaianService {
  /**
   * Mendapatkan seluruh data Capaian Pencatatan (Tabel 1, Tabel 2, Ringkasan, dan 5 Grafik)
   */
  static async getCapaian(
    wilayahId: string = '5',
    tahun: number = 2026
  ): Promise<CapaianPayloadLengkap> {
    // 1. Ambil atau inisialisasi pengaturan
    let setting = await db
      .select()
      .from(capaianPengaturan)
      .where(
        and(
          eq(capaianPengaturan.wilayahId, wilayahId),
          eq(capaianPengaturan.tahun, tahun)
        )
      )
      .limit(1)
      .then((res) => res[0]);

    if (!setting) {
      const id = `${wilayahId}-${tahun}`;
      const [inserted] = await db
        .insert(capaianPengaturan)
        .values({
          id,
          wilayahId,
          tahun,
          hariAcuanLps: 30,
        })
        .returning();
      setting = inserted;
    }

    const pengaturanDomain: PengaturanCapaian = {
      hariAcuanLps: setting?.hariAcuanLps || 30,
    };

    // 2. Ambil target bulanan
    let targets = await db
      .select()
      .from(capaianTargetBulanan)
      .where(
        and(
          eq(capaianTargetBulanan.wilayahId, wilayahId),
          eq(capaianTargetBulanan.tahun, tahun)
        )
      )
      .orderBy(capaianTargetBulanan.bulan);

    // Inisialisasi default 12 bulan jika belum ada
    if (targets.length === 0) {
      const defaultTargets = [];
      for (let b = 1; b <= 12; b++) {
        defaultTargets.push({
          id: `${wilayahId}-${tahun}-${b}`,
          wilayahId,
          tahun,
          bulan: b,
          targetSl: 22400 + b * 20,
          targetM3: '345000',
          versi: 1,
          diubahOleh: 'SYSTEM',
        });
      }
      targets = await db
        .insert(capaianTargetBulanan)
        .values(defaultTargets)
        .returning();
    }

    // 3. Ambil realisasi bulanan (Bulan 0 s.d 12)
    let realisasis = await db
      .select()
      .from(capaianRealisasiBulanan)
      .where(
        and(
          eq(capaianRealisasiBulanan.wilayahId, wilayahId),
          eq(capaianRealisasiBulanan.tahun, tahun)
        )
      )
      .orderBy(capaianRealisasiBulanan.bulan);

    // Inisialisasi default jika belum ada sama sekali
    if (realisasis.length === 0) {
      const defaultRealisasi = [];
      for (let b = 0; b <= 12; b++) {
        defaultRealisasi.push({
          id: `${wilayahId}-${tahun}-${b}`,
          wilayahId,
          tahun,
          bulan: b,
          realisasiSl: 0,
          realisasiM3: '0',
          sumber: b === 0 ? 'MANUAL' : 'OTOMATIS',
          dikunci: b === 0,
          versi: 1,
        });
      }
      realisasis = await db
        .insert(capaianRealisasiBulanan)
        .values(defaultRealisasi)
        .returning();
    }

    // 4. Sinkronisasi data aktual dari cater_baca_meter untuk bulan yang tidak dikunci
    for (const r of realisasis) {
      if (r.bulan >= 1 && !r.dikunci) {
        const thbl = `${tahun}${String(r.bulan).padStart(2, '0')}`;
        const summary = await db
          .select({
            totalSl: sql<number>`count(*)::int`,
            totalM3: sql<number>`coalesce(sum(coalesce(${caterBacaMeter.pakaiM3Revisi}, ${caterBacaMeter.pakaiM3})), 0)::float`,
          })
          .from(caterBacaMeter)
          .where(eq(caterBacaMeter.thbl, thbl))
          .then((res) => res[0]);

        if (summary && summary.totalSl > 0) {
          if (
            r.realisasiSl !== summary.totalSl ||
            Number(r.realisasiM3) !== Number(summary.totalM3)
          ) {
            await db
              .update(capaianRealisasiBulanan)
              .set({
                realisasiSl: summary.totalSl,
                realisasiM3: String(summary.totalM3),
                sumber: 'OTOMATIS',
                updatedAt: new Date(),
              })
              .where(eq(capaianRealisasiBulanan.id, r.id));

            r.realisasiSl = summary.totalSl;
            r.realisasiM3 = String(summary.totalM3);
          }
        }
      }
    }

    // 5. Transformasi ke format Domain Engine
    const targetItems: TargetBulananItem[] = targets.map((t) => ({
      bulan: t.bulan,
      targetSl: t.targetSl,
      targetM3: Number(t.targetM3),
      versi: t.versi,
      catatan: t.catatan,
    }));

    const realisasiItems: RealisasiBulananItem[] = realisasis.map((r) => ({
      bulan: r.bulan,
      realisasiSl: r.realisasiSl,
      realisasiM3: Number(r.realisasiM3),
      sumber: r.sumber,
      dikunci: r.dikunci,
    }));

    // 6. Jalankan Pure Domain Engine
    return prosesHitungCapaian(
      wilayahId,
      tahun,
      targetItems,
      realisasiItems,
      pengaturanDomain
    );
  }

  /**
   * Mengubah target bulanan individual (dengan optimistic locking)
   */
  static async updateTarget(data: {
    wilayahId: string;
    tahun: number;
    bulan: number;
    targetSl: number;
    targetM3: number;
    versi?: number;
    catatan?: string;
    diubahOleh?: string;
  }): Promise<CapaianPayloadLengkap> {
    const {
      wilayahId,
      tahun,
      bulan,
      targetSl,
      targetM3,
      versi,
      catatan,
      diubahOleh = 'OPERATOR',
    } = data;

    const id = `${wilayahId}-${tahun}-${bulan}`;

    const existing = await db
      .select()
      .from(capaianTargetBulanan)
      .where(eq(capaianTargetBulanan.id, id))
      .limit(1)
      .then((res) => res[0]);

    if (existing && versi !== undefined && existing.versi !== versi) {
      const err = new Error(
        `Konflik data: Target bulan ${bulan} telah diubah oleh pengguna lain (versi saat ini: ${existing.versi}, dikirim: ${versi}). Silakan muat ulang.`
      );
      (err as any).statusCode = 409;
      throw err;
    }

    const nextVersi = existing ? existing.versi + 1 : 1;

    await db
      .insert(capaianTargetBulanan)
      .values({
        id,
        wilayahId,
        tahun,
        bulan,
        targetSl,
        targetM3: String(targetM3),
        versi: nextVersi,
        catatan: catatan || null,
        diubahOleh,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          capaianTargetBulanan.wilayahId,
          capaianTargetBulanan.tahun,
          capaianTargetBulanan.bulan,
        ],
        set: {
          targetSl,
          targetM3: String(targetM3),
          versi: nextVersi,
          catatan: catatan || null,
          diubahOleh,
          updatedAt: new Date(),
        },
      });

    // Catat ke audit log
    await db.insert(capaianRiwayat).values({
      id: crypto.randomUUID(),
      wilayahId,
      tahun,
      aksi: 'UPDATE_TARGET',
      dataSebelum: existing ? existing : null,
      dataSesudah: { bulan, targetSl, targetM3, versi: nextVersi },
      diubahOleh,
    });

    return this.getCapaian(wilayahId, tahun);
  }

  /**
   * Bulk update target bulanan (misal saat paste dari Excel)
   */
  static async bulkUpdateTarget(data: {
    wilayahId: string;
    tahun: number;
    items: Array<{ bulan: number; targetSl: number; targetM3: number }>;
    diubahOleh?: string;
  }): Promise<CapaianPayloadLengkap> {
    const { wilayahId, tahun, items, diubahOleh = 'OPERATOR' } = data;

    for (const item of items) {
      const id = `${wilayahId}-${tahun}-${item.bulan}`;
      await db
        .insert(capaianTargetBulanan)
        .values({
          id,
          wilayahId,
          tahun,
          bulan: item.bulan,
          targetSl: item.targetSl,
          targetM3: String(item.targetM3),
          versi: 1,
          diubahOleh,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            capaianTargetBulanan.wilayahId,
            capaianTargetBulanan.tahun,
            capaianTargetBulanan.bulan,
          ],
          set: {
            targetSl: item.targetSl,
            targetM3: String(item.targetM3),
            versi: sql`${capaianTargetBulanan.versi} + 1`,
            diubahOleh,
            updatedAt: new Date(),
          },
        });
    }

    await db.insert(capaianRiwayat).values({
      id: crypto.randomUUID(),
      wilayahId,
      tahun,
      aksi: 'BULK_UPDATE_TARGET',
      dataSebelum: null,
      dataSesudah: { jumlahBulan: items.length, items },
      diubahOleh,
    });

    return this.getCapaian(wilayahId, tahun);
  }

  /**
   * Mengubah realisasi manual (misal Des tahun lalu atau override)
   */
  static async updateRealisasi(data: {
    wilayahId: string;
    tahun: number;
    bulan: number;
    realisasiSl: number;
    realisasiM3: number;
    sumber?: 'MANUAL' | 'OTOMATIS';
    dikunci?: boolean;
    diubahOleh?: string;
  }): Promise<CapaianPayloadLengkap> {
    const {
      wilayahId,
      tahun,
      bulan,
      realisasiSl,
      realisasiM3,
      sumber = 'MANUAL',
      dikunci = true,
      diubahOleh = 'OPERATOR',
    } = data;

    const id = `${wilayahId}-${tahun}-${bulan}`;

    const existing = await db
      .select()
      .from(capaianRealisasiBulanan)
      .where(eq(capaianRealisasiBulanan.id, id))
      .limit(1)
      .then((res) => res[0]);

    await db
      .insert(capaianRealisasiBulanan)
      .values({
        id,
        wilayahId,
        tahun,
        bulan,
        realisasiSl,
        realisasiM3: String(realisasiM3),
        sumber,
        dikunci,
        versi: 1,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          capaianRealisasiBulanan.wilayahId,
          capaianRealisasiBulanan.tahun,
          capaianRealisasiBulanan.bulan,
        ],
        set: {
          realisasiSl,
          realisasiM3: String(realisasiM3),
          sumber,
          dikunci,
          versi: sql`${capaianRealisasiBulanan.versi} + 1`,
          updatedAt: new Date(),
        },
      });

    await db.insert(capaianRiwayat).values({
      id: crypto.randomUUID(),
      wilayahId,
      tahun,
      aksi: 'UPDATE_REALISASI',
      dataSebelum: existing || null,
      dataSesudah: { bulan, realisasiSl, realisasiM3, sumber, dikunci },
      diubahOleh,
    });

    return this.getCapaian(wilayahId, tahun);
  }

  /**
   * Sinkronisasi otomatis dari transaksi fisik `cater_baca_meter`
   */
  static async syncOtomatis(
    wilayahId: string = '5',
    tahun: number = 2026,
    diubahOleh: string = 'OPERATOR'
  ): Promise<CapaianPayloadLengkap> {
    const realisasis = await db
      .select()
      .from(capaianRealisasiBulanan)
      .where(
        and(
          eq(capaianRealisasiBulanan.wilayahId, wilayahId),
          eq(capaianRealisasiBulanan.tahun, tahun)
        )
      );

    let updatedCount = 0;
    for (let b = 1; b <= 12; b++) {
      const existing = realisasis.find((r) => r.bulan === b);
      if (existing && existing.dikunci) continue; // Jangan timpa jika dikunci

      const thbl = `${tahun}${String(b).padStart(2, '0')}`;
      const summary = await db
        .select({
          totalSl: sql<number>`count(*)::int`,
          totalM3: sql<number>`coalesce(sum(coalesce(${caterBacaMeter.pakaiM3Revisi}, ${caterBacaMeter.pakaiM3})), 0)::float`,
        })
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.thbl, thbl))
        .then((res) => res[0]);

      const sl = summary ? summary.totalSl : 0;
      const m3 = summary ? summary.totalM3 : 0;

      const id = `${wilayahId}-${tahun}-${b}`;
      await db
        .insert(capaianRealisasiBulanan)
        .values({
          id,
          wilayahId,
          tahun,
          bulan: b,
          realisasiSl: sl,
          realisasiM3: String(m3),
          sumber: 'OTOMATIS',
          dikunci: false,
          versi: 1,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            capaianRealisasiBulanan.wilayahId,
            capaianRealisasiBulanan.tahun,
            capaianRealisasiBulanan.bulan,
          ],
          set: {
            realisasiSl: sl,
            realisasiM3: String(m3),
            sumber: 'OTOMATIS',
            updatedAt: new Date(),
          },
        });

      updatedCount++;
    }

    await db.insert(capaianRiwayat).values({
      id: crypto.randomUUID(),
      wilayahId,
      tahun,
      aksi: 'SYNC_OTOMATIS',
      dataSebelum: null,
      dataSesudah: { updatedCount },
      diubahOleh,
    });

    return this.getCapaian(wilayahId, tahun);
  }

  /**
   * Mengubah pengaturan (misal hariAcuanLps)
   */
  static async updatePengaturan(data: {
    wilayahId: string;
    tahun: number;
    hariAcuanLps: number;
  }): Promise<CapaianPayloadLengkap> {
    const { wilayahId, tahun, hariAcuanLps } = data;
    const id = `${wilayahId}-${tahun}`;

    await db
      .insert(capaianPengaturan)
      .values({
        id,
        wilayahId,
        tahun,
        hariAcuanLps,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [capaianPengaturan.wilayahId, capaianPengaturan.tahun],
        set: {
          hariAcuanLps,
          updatedAt: new Date(),
        },
      });

    return this.getCapaian(wilayahId, tahun);
  }

  /**
   * Mengambil riwayat perubahan audit log
   */
  static async getRiwayat(wilayahId: string, tahun: number) {
    return db
      .select()
      .from(capaianRiwayat)
      .where(
        and(
          eq(capaianRiwayat.wilayahId, wilayahId),
          eq(capaianRiwayat.tahun, tahun)
        )
      )
      .orderBy(desc(capaianRiwayat.createdAt))
      .limit(50);
  }
}
