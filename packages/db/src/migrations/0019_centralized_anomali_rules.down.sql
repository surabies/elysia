-- Rollback Migration 0019: Centralized Anomaly Rules SSOT
-- 1. Hapus Trigger & Fungsi Immutable
DROP TRIGGER IF EXISTS trg_cek_kode_immutable ON "aturan_anomali";
DROP FUNCTION IF EXISTS trg_aturan_anomali_kode_immutable();

-- 2. Hapus Indeks cater_baca_meter
DROP INDEX IF EXISTS "idx_cater_anomali_list_gin";
DROP INDEX IF EXISTS "idx_cater_kode_anomali_utama";
DROP INDEX IF EXISTS "idx_cater_is_anomali";

-- 3. Hapus Kolom Tambahan cater_baca_meter
ALTER TABLE "cater_baca_meter" 
  DROP COLUMN IF EXISTS "aturan_versi",
  DROP COLUMN IF EXISTS "kode_anomali_list",
  DROP COLUMN IF EXISTS "kode_anomali_utama",
  DROP COLUMN IF EXISTS "is_anomali";

-- 4. Hapus Tabel Aturan dan Log
DROP TABLE IF EXISTS "aturan_anomali_audit_log";
DROP TABLE IF EXISTS "aturan_kondisi_meter_map";
DROP TABLE IF EXISTS "aturan_anomali";
DROP TABLE IF EXISTS "aturan_anomali_versi";

-- 5. Bersihkan Catatan Drizzle Migration 0019 jika ada
DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1795280000000;
