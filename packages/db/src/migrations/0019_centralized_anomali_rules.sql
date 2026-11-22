-- Migration 0019: Centralized Anomaly Rules SSOT
-- 1. Snapshot Versi Aturan Anomali
CREATE TABLE IF NOT EXISTS "aturan_anomali_versi" (
  "versi" integer PRIMARY KEY,
  "snapshot" jsonb NOT NULL,
  "alasan" text NOT NULL,
  "diterbitkan_oleh" varchar(100) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- 2. Master Aturan Anomali (SSOT Ekspresif, Dikelola Operator)
CREATE TABLE IF NOT EXISTS "aturan_anomali" (
  "id" varchar(50) PRIMARY KEY,
  "kode" varchar(50) NOT NULL UNIQUE,
  "nama" varchar(100) NOT NULL,
  "tipe_aturan" varchar(40) NOT NULL,
  "arah" varchar(10) NOT NULL DEFAULT 'KEDUANYA',
  "acuan_pembanding" varchar(30) NOT NULL DEFAULT 'PAKAI_LALU',
  "periode_historis_jml" integer NOT NULL DEFAULT 3,
  "syarat_pakai_lalu_min_m3" numeric(8, 2),
  "selisih_min_m3" numeric(8, 2),
  "min_m3" numeric(8, 2),
  "max_m3" numeric(8, 2),
  "min_persen" numeric(8, 2),
  "max_persen" numeric(8, 2),
  "dihitung_sebagai_anomali" boolean NOT NULL DEFAULT true,
  "ring_tingkat" integer NOT NULL DEFAULT 1,
  "tingkat_keparahan" varchar(20) NOT NULL DEFAULT 'SEDANG',
  "badge_tone" varchar(30) NOT NULL DEFAULT 'problem',
  "urutan" integer NOT NULL DEFAULT 1,
  "aktif" boolean NOT NULL DEFAULT true,
  "syarat_kondisi_lalu" varchar(50) NOT NULL DEFAULT 'ANY',
  "syarat_periode_berturut" integer,
  "kecualikan_jika_berlanjut" boolean NOT NULL DEFAULT false,
  "kecualikan_jika_pakai_lalu_dibawah" numeric(8, 2),
  "deskripsi" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Trigger Immutability Kolom Kode pada aturan_anomali (Idempoten)
CREATE OR REPLACE FUNCTION trg_aturan_anomali_kode_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kode <> OLD.kode THEN
    RAISE EXCEPTION 'Kolom kode aturan anomali bersifat immutable dan tidak boleh diubah setelah dibuat.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cek_kode_immutable ON "aturan_anomali";
CREATE TRIGGER trg_cek_kode_immutable
BEFORE UPDATE ON "aturan_anomali"
FOR EACH ROW EXECUTE FUNCTION trg_aturan_anomali_kode_immutable();

-- 3. Pemetaan Kondisi Fisik Meter (TMSS) ke Kategori Anomali
CREATE TABLE IF NOT EXISTS "aturan_kondisi_meter_map" (
  "id" varchar(50) PRIMARY KEY,
  "kode_tmss" varchar(10) NOT NULL REFERENCES "master_kondisi_catat"("kode_tmss") ON DELETE CASCADE,
  "aturan_anomali_id" varchar(50) NOT NULL REFERENCES "aturan_anomali"("id") ON DELETE CASCADE,
  "is_baseline_normal" boolean NOT NULL DEFAULT false,
  "is_periode_tidak_aktif" boolean NOT NULL DEFAULT false,
  "aktif" boolean NOT NULL DEFAULT true,
  "keterangan" text,
  CONSTRAINT "uq_kondisi_meter_map" UNIQUE ("kode_tmss", "aturan_anomali_id")
);

-- 4. Audit Log Perubahan Aturan Operator
CREATE TABLE IF NOT EXISTS "aturan_anomali_audit_log" (
  "id" varchar(50) PRIMARY KEY,
  "aturan_id" varchar(50) NOT NULL,
  "aksi" varchar(20) NOT NULL CHECK ("aksi" IN ('CREATE', 'UPDATE', 'TOGGLE_AKTIF')),
  "nilai_lama" jsonb,
  "nilai_baru" jsonb NOT NULL,
  "alasan" text NOT NULL,
  "diubah_oleh" varchar(100) NOT NULL,
  "waktu" timestamp NOT NULL DEFAULT now()
);

-- 5. Kolom Klasifikasi Otomatis pada cater_baca_meter
ALTER TABLE "cater_baca_meter" 
  ADD COLUMN IF NOT EXISTS "is_anomali" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "kode_anomali_utama" varchar(50),
  ADD COLUMN IF NOT EXISTS "kode_anomali_list" text[],
  ADD COLUMN IF NOT EXISTS "aturan_versi" integer REFERENCES "aturan_anomali_versi"("versi");

-- 6. Indeks Performa Tinggi untuk Konsistensi Instan Seluruh Tampilan
CREATE INDEX IF NOT EXISTS "idx_cater_is_anomali" ON "cater_baca_meter" ("thbl", "is_anomali");
CREATE INDEX IF NOT EXISTS "idx_cater_kode_anomali_utama" ON "cater_baca_meter" ("thbl", "kode_anomali_utama");
CREATE INDEX IF NOT EXISTS "idx_cater_anomali_list_gin" ON "cater_baca_meter" USING GIN ("kode_anomali_list");
