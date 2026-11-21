ALTER TYPE "public"."status_verifikasi_gwm_enum" ADD VALUE 'DATA_METER_BELUM_LENGKAP' BEFORE 'PENDING';--> statement-breakpoint
ALTER TABLE "water_meter_mutasi" ALTER COLUMN "stand_angkat" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "water_meter_mutasi" ALTER COLUMN "no_meter_baru" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "water_meter_mutasi" ADD CONSTRAINT "gwm_mutasi_approved_data_lengkap_chk" CHECK (("water_meter_mutasi"."status_verifikasi" <> 'APPROVED') OR ("water_meter_mutasi"."no_meter_baru" IS NOT NULL AND "water_meter_mutasi"."stand_angkat" IS NOT NULL));