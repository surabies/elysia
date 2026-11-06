CREATE TABLE "master_kondisi_catat" (
	"kode_tmss" varchar(10) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"kategori" varchar(50) NOT NULL,
	"is_kendala_akses" boolean DEFAULT false NOT NULL,
	"trigger_baca_mandiri" boolean DEFAULT false NOT NULL,
	"deskripsi" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cater_mandiri_pelanggan" (
	"id" text PRIMARY KEY NOT NULL,
	"thbl" varchar(6) NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"stma" numeric(10, 2) NOT NULL,
	"pakai_m3" numeric(10, 2),
	"foto_meter_url" text NOT NULL,
	"foto_rumah_url" text,
	"lokasi_gps" geometry(point),
	"jarak_dari_rumah_meter" numeric(8, 2),
	"is_lokasi_valid" boolean DEFAULT true NOT NULL,
	"channel" varchar(20) DEFAULT 'WEB_PORTAL' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"status_verifikasi" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"alasan_penolakan" text,
	"verified_by" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN "tmss" varchar(10) DEFAULT ' ';--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN "sumber_catat" varchar(30) DEFAULT 'PETUGAS_ONSITE' NOT NULL;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD COLUMN "cater_mandiri_id" text;--> statement-breakpoint
ALTER TABLE "cater_mandiri_pelanggan" ADD CONSTRAINT "cater_mandiri_pelanggan_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cater_mandiri_pelanggan" ADD CONSTRAINT "cater_mandiri_pelanggan_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cater_mandiri_thbl_nolg_idx" ON "cater_mandiri_pelanggan" USING btree ("thbl","nolg");--> statement-breakpoint
CREATE INDEX "cater_mandiri_status_idx" ON "cater_mandiri_pelanggan" USING btree ("status_verifikasi");--> statement-breakpoint
CREATE INDEX "cater_mandiri_gps_idx" ON "cater_mandiri_pelanggan" USING gist ("lokasi_gps");--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_baca_meter_tmss_master_kondisi_catat_kode_tmss_fk" FOREIGN KEY ("tmss") REFERENCES "public"."master_kondisi_catat"("kode_tmss") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_baca_meter_cater_mandiri_id_cater_mandiri_pelanggan_id_fk" FOREIGN KEY ("cater_mandiri_id") REFERENCES "public"."cater_mandiri_pelanggan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cater_tmss_idx" ON "cater_baca_meter" USING btree ("tmss");--> statement-breakpoint
CREATE INDEX "cater_sumber_catat_idx" ON "cater_baca_meter" USING btree ("sumber_catat");