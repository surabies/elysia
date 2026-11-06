CREATE TABLE "biaya_tetap" (
	"id" text PRIMARY KEY NOT NULL,
	"jenis" varchar(30) NOT NULL,
	"ukuran_meter" varchar(20),
	"nominal" numeric(12, 2) NOT NULL,
	"berlaku_mulai" timestamp NOT NULL,
	"berlaku_sampai" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tarif_blok" (
	"id" text PRIMARY KEY NOT NULL,
	"tarif_kode" varchar(10) NOT NULL,
	"blok" integer NOT NULL,
	"batas_awal_m3" integer NOT NULL,
	"batas_akhir_m3" integer,
	"harga_per_m3" numeric(12, 2) NOT NULL,
	"berlaku_mulai" timestamp NOT NULL,
	"berlaku_sampai" timestamp,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tarif_blok_kode_blok_berlaku_unique" UNIQUE("tarif_kode","blok","berlaku_mulai")
);
--> statement-breakpoint
CREATE TABLE "periode_penagihan" (
	"periode" varchar(6) PRIMARY KEY NOT NULL,
	"status" varchar(20) DEFAULT 'BERJALAN' NOT NULL,
	"tanggal_jatuh_tempo" timestamp,
	"ditutup_at" timestamp,
	"ditutup_by_id" text,
	"dibuka_at" timestamp,
	"dibuka_by_id" text,
	"alasan_buka" text,
	"jumlah_sl" integer,
	"total_m3" numeric(12, 2),
	"total_tagihan" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daftar_catat" (
	"id" text PRIMARY KEY NOT NULL,
	"periode" varchar(6) NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"rute_kode" varchar(20),
	"petugas_id" varchar(50),
	"urutan" integer DEFAULT 0 NOT NULL,
	"sumber" varchar(20) DEFAULT 'CARRY_OVER' NOT NULL,
	"status" varchar(30) DEFAULT 'BELUM_DICATAT' NOT NULL,
	"selesai_at" timestamp,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daftar_catat_periode_nolg_unique" UNIQUE("periode","nolg")
);
--> statement-breakpoint
ALTER TABLE "tarif_blok" ADD CONSTRAINT "tarif_blok_tarif_kode_golongan_tarif_kode_fk" FOREIGN KEY ("tarif_kode") REFERENCES "public"."golongan_tarif"("kode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periode_penagihan" ADD CONSTRAINT "periode_penagihan_ditutup_by_id_user_id_fk" FOREIGN KEY ("ditutup_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periode_penagihan" ADD CONSTRAINT "periode_penagihan_dibuka_by_id_user_id_fk" FOREIGN KEY ("dibuka_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD CONSTRAINT "daftar_catat_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD CONSTRAINT "daftar_catat_rute_kode_rute_cater_kode_fk" FOREIGN KEY ("rute_kode") REFERENCES "public"."rute_cater"("kode") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD CONSTRAINT "daftar_catat_petugas_id_petugas_cater_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."petugas_cater"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "biaya_tetap_jenis_berlaku_idx" ON "biaya_tetap" USING btree ("jenis","berlaku_mulai");--> statement-breakpoint
CREATE INDEX "tarif_blok_kode_idx" ON "tarif_blok" USING btree ("tarif_kode");--> statement-breakpoint
CREATE INDEX "periode_penagihan_status_idx" ON "periode_penagihan" USING btree ("status");--> statement-breakpoint
CREATE INDEX "daftar_catat_periode_petugas_idx" ON "daftar_catat" USING btree ("periode","petugas_id");--> statement-breakpoint
CREATE INDEX "daftar_catat_periode_rute_idx" ON "daftar_catat" USING btree ("periode","rute_kode");--> statement-breakpoint
CREATE INDEX "daftar_catat_periode_status_idx" ON "daftar_catat" USING btree ("periode","status");