CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"modul_key" varchar(50) NOT NULL,
	"modul_nama" varchar(100) NOT NULL,
	"kategori" varchar(50) DEFAULT 'OPERASIONAL' NOT NULL,
	"deskripsi" text,
	"urutan" numeric(4, 0) DEFAULT '0' NOT NULL,
	"superadmin" boolean DEFAULT true NOT NULL,
	"staff_billing" boolean DEFAULT false NOT NULL,
	"verifikator_1" boolean DEFAULT false NOT NULL,
	"verifikator_2" boolean DEFAULT false NOT NULL,
	"verifikator_3" boolean DEFAULT false NOT NULL,
	"executive" boolean DEFAULT false NOT NULL,
	"pelaksana" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_modul_key_unique" UNIQUE("modul_key")
);
--> statement-breakpoint
CREATE TABLE "kpi_indikator" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"objektif_id" varchar(100) NOT NULL,
	"nama" varchar(200) NOT NULL,
	"arah" varchar(10) DEFAULT 'higher' NOT NULL,
	"pemilik_id" varchar(50) NOT NULL,
	"pemilik_nama" varchar(100) NOT NULL,
	"pemilik_inisial" varchar(10) NOT NULL,
	"bobot" integer DEFAULT 10 NOT NULL,
	"baseline" double precision DEFAULT 0 NOT NULL,
	"target" double precision DEFAULT 0 NOT NULL,
	"format" varchar(20) DEFAULT 'percent' NOT NULL,
	"simbol_mata_uang" varchar(10) DEFAULT 'Rp',
	"pengali_satuan" double precision DEFAULT 1,
	"sumber_data" varchar(50) DEFAULT 'manual',
	"urutan" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kpi_indikator_bobot_range" CHECK ("kpi_indikator"."bobot" >= 0 AND "kpi_indikator"."bobot" <= 100)
);
--> statement-breakpoint
CREATE TABLE "kpi_objektif" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"perspektif_id" varchar(50) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"urutan" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_perspektif" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"bobot_skor" integer DEFAULT 25 NOT NULL,
	"deskripsi" text,
	"urutan" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_realisasi" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"indikator_id" varchar(100) NOT NULL,
	"periode" varchar(30) NOT NULL,
	"nilai_aktual" double precision,
	"sparkline" text,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast" (
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
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_indikator" ADD CONSTRAINT "kpi_indikator_objektif_id_kpi_objektif_id_fk" FOREIGN KEY ("objektif_id") REFERENCES "public"."kpi_objektif"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_objektif" ADD CONSTRAINT "kpi_objektif_perspektif_id_kpi_perspektif_id_fk" FOREIGN KEY ("perspektif_id") REFERENCES "public"."kpi_perspektif"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_realisasi" ADD CONSTRAINT "kpi_realisasi_indikator_id_kpi_indikator_id_fk" FOREIGN KEY ("indikator_id") REFERENCES "public"."kpi_indikator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_permissions_modul_key_idx" ON "role_permissions" USING btree ("modul_key");--> statement-breakpoint
CREATE INDEX "role_permissions_kategori_idx" ON "role_permissions" USING btree ("kategori");--> statement-breakpoint
CREATE UNIQUE INDEX "kpi_realisasi_indikator_periode_idx" ON "kpi_realisasi" USING btree ("indikator_id","periode");--> statement-breakpoint
CREATE INDEX "idx_broadcast_kategori" ON "broadcast" USING btree ("kategori");--> statement-breakpoint
CREATE INDEX "idx_broadcast_aktif" ON "broadcast" USING btree ("aktif");--> statement-breakpoint
CREATE INDEX "idx_broadcast_urutan" ON "broadcast" USING btree ("urutan");