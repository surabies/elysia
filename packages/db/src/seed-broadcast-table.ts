import { conn } from './client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function createBroadcastTable() {
  console.log('Membuat tabel broadcast di database PostgreSQL...');

  await conn`
    CREATE TABLE IF NOT EXISTS "broadcast" (
      "id" varchar(50) PRIMARY KEY NOT NULL,
      "judul" text NOT NULL,
      "ringkasan" text NOT NULL,
      "kategori" varchar(30) DEFAULT 'DARURAT' NOT NULL,
      "status" varchar(30) DEFAULT 'DALAM_PENGERJAAN' NOT NULL,
      "progres_persen" integer DEFAULT 0 NOT NULL,
      "prioritas" varchar(20) DEFAULT 'NORMAL' NOT NULL,
      "waktu_mulai" text DEFAULT '' NOT NULL,
      "estimasi_selesai" text DEFAULT '' NOT NULL,
      "penyebab" text DEFAULT '' NOT NULL,
      "dampak" text DEFAULT '' NOT NULL,
      "tindakan_penanganan" text DEFAULT '' NOT NULL,
      "wilayah_terdampak" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "kontak_bantuan" jsonb,
      "gambar_utama" text,
      "gambar_utama_public_id" text,
      "tipe_gambar_utama" varchar(30) DEFAULT 'FOTO_KEGIATAN',
      "galeri_media" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "promo_details" jsonb,
      "aktif" boolean DEFAULT true NOT NULL,
      "tampilkan_di_ticker" boolean DEFAULT true NOT NULL,
      "tampilkan_di_spotlight" boolean DEFAULT true NOT NULL,
      "urutan" integer DEFAULT 0 NOT NULL,
      "diperbarui_pada" text DEFAULT 'Baru saja' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `;

  await conn`CREATE INDEX IF NOT EXISTS "idx_broadcast_kategori" ON "broadcast" ("kategori");`;
  await conn`CREATE INDEX IF NOT EXISTS "idx_broadcast_aktif" ON "broadcast" ("aktif");`;
  await conn`CREATE INDEX IF NOT EXISTS "idx_broadcast_urutan" ON "broadcast" ("urutan");`;

  console.log('Tabel broadcast dan indeks berhasil dipasang!');
  process.exit(0);
}

createBroadcastTable().catch((err) => {
  console.error('Gagal membuat tabel broadcast:', err);
  process.exit(1);
});
