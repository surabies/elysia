import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/elysia_db';
const sql = postgres(databaseUrl);

async function main() {
  console.log('Menerapkan skema tabel capaian...');

  await sql`
    CREATE TABLE IF NOT EXISTS "capaian_pengaturan" (
      "id" varchar(50) PRIMARY KEY NOT NULL,
      "wilayah_id" varchar(20) NOT NULL,
      "tahun" integer NOT NULL,
      "hari_acuan_lps" integer DEFAULT 30 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "capaian_pengaturan_wilayah_tahun_idx" UNIQUE("wilayah_id","tahun")
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "capaian_realisasi_bulanan" (
      "id" varchar(50) PRIMARY KEY NOT NULL,
      "wilayah_id" varchar(20) NOT NULL,
      "tahun" integer NOT NULL,
      "bulan" integer NOT NULL,
      "realisasi_sl" integer DEFAULT 0 NOT NULL,
      "realisasi_m3" numeric(14, 2) DEFAULT '0' NOT NULL,
      "sumber" varchar(20) DEFAULT 'OTOMATIS' NOT NULL,
      "dikunci" boolean DEFAULT false NOT NULL,
      "versi" integer DEFAULT 1 NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "capaian_realisasi_bulanan_wilayah_tahun_bulan_idx" UNIQUE("wilayah_id","tahun","bulan")
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "capaian_riwayat" (
      "id" varchar(50) PRIMARY KEY NOT NULL,
      "wilayah_id" varchar(20) NOT NULL,
      "tahun" integer NOT NULL,
      "aksi" varchar(50) NOT NULL,
      "data_sebelum" jsonb,
      "data_sesudah" jsonb,
      "diubah_oleh" varchar(100) DEFAULT 'SYSTEM' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "capaian_target_bulanan" (
      "id" varchar(50) PRIMARY KEY NOT NULL,
      "wilayah_id" varchar(20) NOT NULL,
      "tahun" integer NOT NULL,
      "bulan" integer NOT NULL,
      "target_sl" integer DEFAULT 0 NOT NULL,
      "target_m3" numeric(14, 2) DEFAULT '0' NOT NULL,
      "versi" integer DEFAULT 1 NOT NULL,
      "catatan" text,
      "diubah_oleh" varchar(100) DEFAULT 'SYSTEM' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "capaian_target_bulanan_wilayah_tahun_bulan_idx" UNIQUE("wilayah_id","tahun","bulan")
    );
  `;

  console.log('Tabel berhasil dipastikan ada. Melakukan seeding data Wilayah 5 Tahun 2026...');

  // Pengaturan default
  await sql`
    INSERT INTO "capaian_pengaturan" ("id", "wilayah_id", "tahun", "hari_acuan_lps")
    VALUES ('5-2026', '5', 2026, 30)
    ON CONFLICT ("wilayah_id", "tahun") DO NOTHING;
  `;

  // Target Bulanan 2026
  const targetData = [
    { bulan: 1, targetSl: 22450, targetM3: 340000 },
    { bulan: 2, targetSl: 22470, targetM3: 338000 },
    { bulan: 3, targetSl: 22490, targetM3: 345000 },
    { bulan: 4, targetSl: 22510, targetM3: 340000 },
    { bulan: 5, targetSl: 22530, targetM3: 342000 },
    { bulan: 6, targetSl: 22550, targetM3: 345000 },
    { bulan: 7, targetSl: 22570, targetM3: 350000 },
    { bulan: 8, targetSl: 22590, targetM3: 348000 },
    { bulan: 9, targetSl: 22610, targetM3: 345000 },
    { bulan: 10, targetSl: 22630, targetM3: 345000 },
    { bulan: 11, targetSl: 22650, targetM3: 345000 },
    { bulan: 12, targetSl: 22670, targetM3: 345000 },
  ];

  for (const t of targetData) {
    const id = `5-2026-${t.bulan}`;
    await sql`
      INSERT INTO "capaian_target_bulanan" ("id", "wilayah_id", "tahun", "bulan", "target_sl", "target_m3", "versi", "diubah_oleh")
      VALUES (${id}, '5', 2026, ${t.bulan}, ${t.targetSl}, ${t.targetM3}, 1, 'SEED_EXCEL')
      ON CONFLICT ("wilayah_id", "tahun", "bulan") DO UPDATE SET
        "target_sl" = EXCLUDED."target_sl",
        "target_m3" = EXCLUDED."target_m3";
    `;
  }

  // Realisasi Bulanan 2026 (termasuk bulan 0 = Des 2025)
  const realisasiData = [
    { bulan: 0, sl: 22428, m3: 345989, sumber: 'MANUAL', kunci: true },
    { bulan: 1, sl: 22435, m3: 328601, sumber: 'MANUAL', kunci: true },
    { bulan: 2, sl: 22450, m3: 335795, sumber: 'MANUAL', kunci: true },
    { bulan: 3, sl: 22475, m3: 339400, sumber: 'MANUAL', kunci: true },
    { bulan: 4, sl: 22490, m3: 332150, sumber: 'MANUAL', kunci: true },
    { bulan: 5, sl: 22505, m3: 336800, sumber: 'MANUAL', kunci: true },
    { bulan: 6, sl: 22515, m3: 340100, sumber: 'MANUAL', kunci: true },
    { bulan: 7, sl: 22520, m3: 341250, sumber: 'MANUAL', kunci: true },
    { bulan: 8, sl: 22525, m3: 338900, sumber: 'MANUAL', kunci: true },
    { bulan: 9, sl: 22522, m3: 335600, sumber: 'MANUAL', kunci: true },
    { bulan: 10, sl: 22524, m3: 330209, sumber: 'OTOMATIS', kunci: false },
    { bulan: 11, sl: 0, m3: 0, sumber: 'OTOMATIS', kunci: false },
    { bulan: 12, sl: 0, m3: 0, sumber: 'OTOMATIS', kunci: false },
  ];

  for (const r of realisasiData) {
    const id = `5-2026-${r.bulan}`;
    await sql`
      INSERT INTO "capaian_realisasi_bulanan" ("id", "wilayah_id", "tahun", "bulan", "realisasi_sl", "realisasi_m3", "sumber", "dikunci", "versi")
      VALUES (${id}, '5', 2026, ${r.bulan}, ${r.sl}, ${r.m3}, ${r.sumber}, ${r.kunci}, 1)
      ON CONFLICT ("wilayah_id", "tahun", "bulan") DO UPDATE SET
        "realisasi_sl" = EXCLUDED."realisasi_sl",
        "realisasi_m3" = EXCLUDED."realisasi_m3",
        "sumber" = EXCLUDED."sumber",
        "dikunci" = EXCLUDED."dikunci";
    `;
  }

  console.log('Seeding capaian selesai!');
  await sql.end();
}

main().catch((err) => {
  console.error('Gagal menerapkan capaian:', err);
  process.exit(1);
});
