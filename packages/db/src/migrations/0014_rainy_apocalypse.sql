ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'petugas' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD COLUMN IF NOT EXISTS "no_meter_asli" varchar(50);--> statement-breakpoint
ALTER TABLE "pelanggan" ADD COLUMN IF NOT EXISTS "ukuran_meter" varchar(20) DEFAULT '1/2' NOT NULL;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD COLUMN IF NOT EXISTS "merk_meter" varchar(50);--> statement-breakpoint
ALTER TABLE "pelanggan" ADD COLUMN IF NOT EXISTS "tgl_pasang_meter" timestamp;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD COLUMN IF NOT EXISTS "perlu_verifikasi" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD COLUMN IF NOT EXISTS "catatan_verifikasi" text;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD COLUMN IF NOT EXISTS "stand_awal" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD COLUMN IF NOT EXISTS "pakai_lalu" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "cater_baca_meter" DROP CONSTRAINT IF EXISTS "cater_thbl_nolg_unique";--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_thbl_nolg_unique" UNIQUE("thbl","nolg");--> statement-breakpoint
ALTER TABLE "rekening_drd" DROP CONSTRAINT IF EXISTS "drd_thbl_nolg_unique";--> statement-breakpoint
ALTER TABLE "rekening_drd" ADD CONSTRAINT "drd_thbl_nolg_unique" UNIQUE("thbl","nolg");