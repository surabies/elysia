/**
 * Service: Kebijakan Dinamis Pengaduan Berversi (Policy as Data)
 * Mengelola dokumen kebijakan SLA, jendela konfirmasi, batas reopen, radius duplikat, dan matriks wewenang
 * yang dapat diubah dinamis tanpa deploy ulang kode. Dilengkapi audit SK Direksi dan rollback.
 */

import { eq, desc, sql } from 'drizzle-orm';
import {
  db,
  kebijakanPengaduan,
  pengaduan,
  user,
  type KebijakanPengaduanRow,
} from '@cater/db';
import { DEFAULT_KEBIJAKAN_CONFIG } from "@cater/backend/domain/pengaduan/pengaduan.config";
import type {
  KebijakanConfig,
  KebijakanPengaduan,
  StatusKebijakan,
} from '@cater/types';

export interface SimpanDraftKebijakanInput {
  nomorSk?: string;
  alasanPerubahan?: string;
  config: Partial<KebijakanConfig>;
  dibuatOleh?: string | null;
}

export interface TerbitkanKebijakanInput {
  nomorSk: string;
  alasanPerubahan: string;
  disetujuiOleh?: string | null;
}

export interface RollbackKebijakanInput {
  alasanRollback: string;
  disetujuiOleh?: string | null;
}

export class KebijakanPengaduanService {
  private activePolicyCache: KebijakanPengaduan | null = null;
  private cacheExpiresAt: number = 0;
  private readonly CACHE_TTL_MS = 60_000; // In-memory cache 1 menit, invalidasi instan saat publish/rollback

  /**
   * Helper untuk validasi FK userId agar tidak melanggar constraint postgres
   */
  private async sanitizeUserId(userId?: string | null): Promise<string | null> {
    if (!userId) return null;
    try {
      const [found] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      return found ? found.id : null;
    } catch {
      return null;
    }
  }

  /**
   * Inisialisasi Skema DDL dan Baris Versi 1 Awal (Idempotent)
   */
  async ensureKebijakanTable(): Promise<void> {
    try {
      // 1. DDL Enum & Table
      await db.execute(sql`
        DO $$ BEGIN
          CREATE TYPE status_kebijakan_enum AS ENUM ('DRAFT', 'AKTIF', 'ARSIP');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        CREATE TABLE IF NOT EXISTS kebijakan_pengaduan (
          id text PRIMARY KEY,
          versi integer NOT NULL UNIQUE,
          status status_kebijakan_enum NOT NULL DEFAULT 'DRAFT',
          nomor_sk varchar(100),
          alasan_perubahan text,
          tanggal_berlaku timestamp NOT NULL DEFAULT NOW(),
          config jsonb NOT NULL,
          dibuat_oleh text REFERENCES "user"(id) ON DELETE SET NULL,
          disetujui_oleh text REFERENCES "user"(id) ON DELETE SET NULL,
          created_at timestamp NOT NULL DEFAULT NOW(),
          updated_at timestamp NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS kebijakan_pengaduan_versi_idx ON kebijakan_pengaduan (versi);
        CREATE INDEX IF NOT EXISTS kebijakan_pengaduan_status_idx ON kebijakan_pengaduan (status);

        ALTER TABLE pengaduan ADD COLUMN IF NOT EXISTS kebijakan_versi integer DEFAULT 1;
      `);

      // 2. Cek ketersediaan baris kebijakan awal
      const [existing] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(kebijakanPengaduan);

      if (!existing || Number(existing.count) === 0) {
        await db.insert(kebijakanPengaduan).values({
          id: crypto.randomUUID(),
          versi: 1,
          status: 'AKTIF',
          nomorSk: 'SK.001/DIR/2026',
          alasanPerubahan: 'Inisialisasi Standar Kebijakan Pengaduan Dinamis v1.0',
          tanggalBerlaku: new Date(),
          config: DEFAULT_KEBIJAKAN_CONFIG as any,
          dibuatOleh: null,
          disetujuiOleh: null,
        });
      }
    } catch (err) {
      console.warn('[ENSURE_KEBIJAKAN_TABLE_WARN]', err);
    }
  }

  /**
   * Invalidasi Cache Memori
   */
  invalidateCache(): void {
    this.activePolicyCache = null;
    this.cacheExpiresAt = 0;
  }

  /**
   * Mengambil Dokumen Kebijakan yang Sedang AKTIF
   */
  async getKebijakanAktif(): Promise<KebijakanPengaduan> {
    const now = Date.now();
    if (this.activePolicyCache && now < this.cacheExpiresAt) {
      return this.activePolicyCache;
    }

    try {
      const [row] = await db
        .select()
        .from(kebijakanPengaduan)
        .where(eq(kebijakanPengaduan.status, 'AKTIF'))
        .orderBy(desc(kebijakanPengaduan.versi))
        .limit(1);

      if (row) {
        const item: KebijakanPengaduan = {
          id: row.id,
          versi: row.versi,
          status: row.status as StatusKebijakan,
          nomorSk: row.nomorSk,
          alasanPerubahan: row.alasanPerubahan,
          tanggalBerlaku: row.tanggalBerlaku,
          config: (row.config as KebijakanConfig) ?? DEFAULT_KEBIJAKAN_CONFIG,
          dibuatOleh: row.dibuatOleh,
          disetujuiOleh: row.disetujuiOleh,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
        this.activePolicyCache = item;
        this.cacheExpiresAt = now + this.CACHE_TTL_MS;
        return item;
      }

      // Jika belum ada di database, lakukan inisialisasi awal
      await this.ensureKebijakanTable();
      const [created] = await db
        .select()
        .from(kebijakanPengaduan)
        .where(eq(kebijakanPengaduan.status, 'AKTIF'))
        .orderBy(desc(kebijakanPengaduan.versi))
        .limit(1);

      if (created) {
        const item: KebijakanPengaduan = {
          id: created.id,
          versi: created.versi,
          status: created.status as StatusKebijakan,
          nomorSk: created.nomorSk,
          alasanPerubahan: created.alasanPerubahan,
          tanggalBerlaku: created.tanggalBerlaku,
          config: (created.config as KebijakanConfig) ?? DEFAULT_KEBIJAKAN_CONFIG,
          dibuatOleh: created.dibuatOleh,
          disetujuiOleh: created.disetujuiOleh,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
        this.activePolicyCache = item;
        this.cacheExpiresAt = now + this.CACHE_TTL_MS;
        return item;
      }
    } catch (err) {
      console.warn('[GET_KEBIJAKAN_AKTIF_ERR]', err);
    }

    // Fallback murni jika database belum siap
    return {
      id: 'default-v1',
      versi: 1,
      status: 'AKTIF',
      nomorSk: 'SK.001/DIR/2026',
      alasanPerubahan: 'Fallback Inisial Default',
      tanggalBerlaku: new Date(),
      config: DEFAULT_KEBIJAKAN_CONFIG,
      dibuatOleh: null,
      disetujuiOleh: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Mengambil Riwayat Semua Dokumen Kebijakan (Semua Versi)
   */
  async getRiwayatKebijakan(): Promise<KebijakanPengaduan[]> {
    await this.ensureKebijakanTable();
    const rows = await db
      .select()
      .from(kebijakanPengaduan)
      .orderBy(desc(kebijakanPengaduan.versi));

    return rows.map((r) => ({
      id: r.id,
      versi: r.versi,
      status: r.status as StatusKebijakan,
      nomorSk: r.nomorSk,
      alasanPerubahan: r.alasanPerubahan,
      tanggalBerlaku: r.tanggalBerlaku,
      config: (r.config as KebijakanConfig) ?? DEFAULT_KEBIJAKAN_CONFIG,
      dibuatOleh: r.dibuatOleh,
      disetujuiOleh: r.disetujuiOleh,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Mengambil Dokumen Kebijakan Spesifik Berdasarkan Nomor Versi
   */
  async getKebijakanByVersi(versi: number): Promise<KebijakanPengaduan | null> {
    await this.ensureKebijakanTable();
    const [row] = await db
      .select()
      .from(kebijakanPengaduan)
      .where(eq(kebijakanPengaduan.versi, versi));

    if (!row) return null;

    return {
      id: row.id,
      versi: row.versi,
      status: row.status as StatusKebijakan,
      nomorSk: row.nomorSk,
      alasanPerubahan: row.alasanPerubahan,
      tanggalBerlaku: row.tanggalBerlaku,
      config: (row.config as KebijakanConfig) ?? DEFAULT_KEBIJAKAN_CONFIG,
      dibuatOleh: row.dibuatOleh,
      disetujuiOleh: row.disetujuiOleh,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Menyimpan / Memperbarui Dokumen Kebijakan Berstatus DRAFT
   */
  async simpanDraftKebijakan(input: SimpanDraftKebijakanInput): Promise<KebijakanPengaduan> {
    await this.ensureKebijakanTable();
    const creatorId = await this.sanitizeUserId(input.dibuatOleh);

    // Dapatkan konfigurasi dasar dari kebijakan aktif
    const aktif = await this.getKebijakanAktif();
    const baseConfig = aktif.config;

    // Gabungkan config secara mendalam
    const mergedConfig: KebijakanConfig = {
      ...baseConfig,
      ...input.config,
      slaPrioritas: {
        ...baseConfig.slaPrioritas,
        ...(input.config.slaPrioritas ?? {}),
      },
      slaOverridePerJenis: {
        ...baseConfig.slaOverridePerJenis,
        ...(input.config.slaOverridePerJenis ?? {}),
      },
      prioritasDefaultPerJenis: {
        ...baseConfig.prioritasDefaultPerJenis,
        ...(input.config.prioritasDefaultPerJenis ?? {}),
      },
      klasifikasiPerJenis: {
        ...baseConfig.klasifikasiPerJenis,
        ...(input.config.klasifikasiPerJenis ?? {}),
      },
    };

    // Cek apakah sudah ada DRAFT
    const [existingDraft] = await db
      .select()
      .from(kebijakanPengaduan)
      .where(eq(kebijakanPengaduan.status, 'DRAFT'))
      .orderBy(desc(kebijakanPengaduan.versi))
      .limit(1);

    if (existingDraft) {
      const [updated] = await db
        .update(kebijakanPengaduan)
        .set({
          nomorSk: input.nomorSk ?? existingDraft.nomorSk,
          alasanPerubahan: input.alasanPerubahan ?? existingDraft.alasanPerubahan,
          config: mergedConfig as any,
          dibuatOleh: creatorId ?? existingDraft.dibuatOleh,
          updatedAt: new Date(),
        })
        .where(eq(kebijakanPengaduan.id, existingDraft.id))
        .returning();

      return {
        id: updated.id,
        versi: updated.versi,
        status: updated.status as StatusKebijakan,
        nomorSk: updated.nomorSk,
        alasanPerubahan: updated.alasanPerubahan,
        tanggalBerlaku: updated.tanggalBerlaku,
        config: updated.config as KebijakanConfig,
        dibuatOleh: updated.dibuatOleh,
        disetujuiOleh: updated.disetujuiOleh,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    // Jika belum ada draft, hitung nomor versi baru
    const [maxRow] = await db
      .select({ maxVersi: sql<number>`COALESCE(MAX(${kebijakanPengaduan.versi}), 0)` })
      .from(kebijakanPengaduan);

    const nextVersi = (maxRow?.maxVersi ?? 0) + 1;

    const [created] = await db
      .insert(kebijakanPengaduan)
      .values({
        id: crypto.randomUUID(),
        versi: nextVersi,
        status: 'DRAFT',
        nomorSk: input.nomorSk || null,
        alasanPerubahan: input.alasanPerubahan || 'Draft Pembaruan Kebijakan Pengaduan',
        tanggalBerlaku: new Date(),
        config: mergedConfig as any,
        dibuatOleh: creatorId,
        disetujuiOleh: null,
      })
      .returning();

    return {
      id: created.id,
      versi: created.versi,
      status: created.status as StatusKebijakan,
      nomorSk: created.nomorSk,
      alasanPerubahan: created.alasanPerubahan,
      tanggalBerlaku: created.tanggalBerlaku,
      config: created.config as KebijakanConfig,
      dibuatOleh: created.dibuatOleh,
      disetujuiOleh: created.disetujuiOleh,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Menerbitkan Versi Kebijakan Menjadi AKTIF (Dengan SK Direksi)
   */
  async terbitkanKebijakan(
    versi: number,
    input: TerbitkanKebijakanInput
  ): Promise<KebijakanPengaduan> {
    await this.ensureKebijakanTable();
    const approverId = await this.sanitizeUserId(input.disetujuiOleh);

    const [target] = await db
      .select()
      .from(kebijakanPengaduan)
      .where(eq(kebijakanPengaduan.versi, versi));

    if (!target) {
      throw new Error(`Kebijakan pengaduan versi ${versi} tidak ditemukan.`);
    }

    return await db.transaction(async (tx) => {
      // 1. Arsipkan semua yang saat ini aktif
      await tx
        .update(kebijakanPengaduan)
        .set({ status: 'ARSIP', updatedAt: new Date() })
        .where(eq(kebijakanPengaduan.status, 'AKTIF'));

      // 2. Aktifkan versi target
      const [published] = await tx
        .update(kebijakanPengaduan)
        .set({
          status: 'AKTIF',
          nomorSk: input.nomorSk,
          alasanPerubahan: input.alasanPerubahan,
          disetujuiOleh: approverId,
          tanggalBerlaku: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(kebijakanPengaduan.id, target.id))
        .returning();

      this.invalidateCache();

      return {
        id: published.id,
        versi: published.versi,
        status: published.status as StatusKebijakan,
        nomorSk: published.nomorSk,
        alasanPerubahan: published.alasanPerubahan,
        tanggalBerlaku: published.tanggalBerlaku,
        config: published.config as KebijakanConfig,
        dibuatOleh: published.dibuatOleh,
        disetujuiOleh: published.disetujuiOleh,
        createdAt: published.createdAt,
        updatedAt: published.updatedAt,
      };
    });
  }

  /**
   * Melakukan Rollback Kebijakan ke Versi Sebelumnya
   */
  async rollbackKebijakan(
    versiTarget: number,
    input: RollbackKebijakanInput
  ): Promise<KebijakanPengaduan> {
    await this.ensureKebijakanTable();
    const approverId = await this.sanitizeUserId(input.disetujuiOleh);

    const [target] = await db
      .select()
      .from(kebijakanPengaduan)
      .where(eq(kebijakanPengaduan.versi, versiTarget));

    if (!target) {
      throw new Error(`Target rollback kebijakan versi ${versiTarget} tidak ditemukan.`);
    }

    return await db.transaction(async (tx) => {
      // 1. Arsipkan versi yang sedang aktif
      await tx
        .update(kebijakanPengaduan)
        .set({ status: 'ARSIP', updatedAt: new Date() })
        .where(eq(kebijakanPengaduan.status, 'AKTIF'));

      // 2. Aktifkan kembali target versi
      const [rolledBack] = await tx
        .update(kebijakanPengaduan)
        .set({
          status: 'AKTIF',
          alasanPerubahan: `[ROLLBACK ke v${versiTarget}] ${input.alasanRollback}`,
          disetujuiOleh: approverId ?? target.disetujuiOleh,
          tanggalBerlaku: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(kebijakanPengaduan.id, target.id))
        .returning();

      this.invalidateCache();

      return {
        id: rolledBack.id,
        versi: rolledBack.versi,
        status: rolledBack.status as StatusKebijakan,
        nomorSk: rolledBack.nomorSk,
        alasanPerubahan: rolledBack.alasanPerubahan,
        tanggalBerlaku: rolledBack.tanggalBerlaku,
        config: rolledBack.config as KebijakanConfig,
        dibuatOleh: rolledBack.dibuatOleh,
        disetujuiOleh: rolledBack.disetujuiOleh,
        createdAt: rolledBack.createdAt,
        updatedAt: rolledBack.updatedAt,
      };
    });
  }
}

export const kebijakanPengaduanService = new KebijakanPengaduanService();
