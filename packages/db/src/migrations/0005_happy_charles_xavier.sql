CREATE TYPE "public"."alasan_ganti_meter_enum" AS ENUM('RUSAK', 'MATI', 'BURAM', 'HILANG', 'TERA_ULANG', 'UKURAN_BERUBAH', 'LAINNYA');--> statement-breakpoint
CREATE TYPE "public"."status_verifikasi_gwm_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "grand_water_meter" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"kode_gwm" varchar(50) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"zona_kode" varchar(20),
	"dma_kode" varchar(20),
	"ukuran_pipa" varchar(20),
	"merk" varchar(50),
	"no_seri" varchar(50),
	"titik_lokasi" geometry(point),
	"alamat" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grand_water_meter_kode_gwm_unique" UNIQUE("kode_gwm")
);
--> statement-breakpoint
CREATE TABLE "gwm_baca_meter" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gwm_id" varchar(36) NOT NULL,
	"periode" integer NOT NULL,
	"tgl_baca" timestamp DEFAULT now() NOT NULL,
	"stand_awal" integer NOT NULL,
	"stand_akhir" integer NOT NULL,
	"total_debit_m3" integer NOT NULL,
	"petugas_id" text,
	"foto_stand" text,
	"titik_lokasi" geometry(point),
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_meter_mutasi" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"periode" integer NOT NULL,
	"tgl_ganti" timestamp DEFAULT now() NOT NULL,
	"alasan" "alasan_ganti_meter_enum" DEFAULT 'RUSAK' NOT NULL,
	"keterangan" text,
	"no_meter_lama" varchar(50) NOT NULL,
	"stand_angkat" integer NOT NULL,
	"foto_stand_angkat" text,
	"no_meter_baru" varchar(50) NOT NULL,
	"merk_baru" varchar(50),
	"ukuran_baru" varchar(20) DEFAULT '1/2',
	"stand_pasang" integer DEFAULT 0 NOT NULL,
	"no_segel_baru" varchar(50),
	"foto_meter_baru" text,
	"petugas_pasang" varchar(100),
	"verifikator_id" text,
	"status_verifikasi" "status_verifikasi_gwm_enum" DEFAULT 'PENDING' NOT NULL,
	"catatan_verifikasi" text,
	"tgl_verifikasi" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grand_water_meter" ADD CONSTRAINT "grand_water_meter_zona_kode_zona_distribusi_kode_fk" FOREIGN KEY ("zona_kode") REFERENCES "public"."zona_distribusi"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gwm_baca_meter" ADD CONSTRAINT "gwm_baca_meter_gwm_id_grand_water_meter_id_fk" FOREIGN KEY ("gwm_id") REFERENCES "public"."grand_water_meter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gwm_baca_meter" ADD CONSTRAINT "gwm_baca_meter_petugas_id_user_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_meter_mutasi" ADD CONSTRAINT "water_meter_mutasi_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_meter_mutasi" ADD CONSTRAINT "water_meter_mutasi_verifikator_id_user_id_fk" FOREIGN KEY ("verifikator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grand_water_meter_zona_idx" ON "grand_water_meter" USING btree ("zona_kode");--> statement-breakpoint
CREATE INDEX "grand_water_meter_lokasi_idx" ON "grand_water_meter" USING gist ("titik_lokasi");--> statement-breakpoint
CREATE INDEX "gwm_baca_meter_gwm_periode_idx" ON "gwm_baca_meter" USING btree ("gwm_id","periode");--> statement-breakpoint
CREATE INDEX "gwm_baca_meter_lokasi_idx" ON "gwm_baca_meter" USING gist ("titik_lokasi");--> statement-breakpoint
CREATE INDEX "gwm_mutasi_nolg_idx" ON "water_meter_mutasi" USING btree ("nolg");--> statement-breakpoint
CREATE INDEX "gwm_mutasi_periode_idx" ON "water_meter_mutasi" USING btree ("periode");--> statement-breakpoint
CREATE INDEX "gwm_mutasi_status_idx" ON "water_meter_mutasi" USING btree ("status_verifikasi");