ALTER TABLE "cater_baca_meter" ADD COLUMN "pakai_tagih" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN "alasan_taksir" varchar(50);--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN "water_meter_mutasi_id" varchar(36);--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_baca_meter_water_meter_mutasi_id_water_meter_mutasi_id_fk" FOREIGN KEY ("water_meter_mutasi_id") REFERENCES "public"."water_meter_mutasi"("id") ON DELETE set null ON UPDATE no action;