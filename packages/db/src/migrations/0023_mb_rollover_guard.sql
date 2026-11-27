ALTER TABLE "water_meter" ADD COLUMN IF NOT EXISTS "jumlah_digit" integer;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN IF NOT EXISTS "mb_tanpa_stand_angkat" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN IF NOT EXISTS "digit_rollover" integer;--> statement-breakpoint
ALTER TABLE "water_meter_mutasi" DROP CONSTRAINT IF EXISTS "gwm_mutasi_approved_data_lengkap_chk";--> statement-breakpoint
UPDATE "master_kondisi_catat" SET "mode_hitung" = 'MUDA_KEMBALI', "deskripsi" = 'Angka meter roll-over melewati batas maksimum register (mis. 9999 -> 0000 / 99999 -> 00000)' WHERE "kode_tmss" = 'U';
