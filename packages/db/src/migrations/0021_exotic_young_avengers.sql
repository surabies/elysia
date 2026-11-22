CREATE TYPE "public"."status_kebijakan_enum" AS ENUM('DRAFT', 'AKTIF', 'ARSIP');--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'DIREKSI';--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'SENIOR_MANAGER';--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'MANAGER';--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'SUPERVISOR';--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'STAFF';--> statement-breakpoint
CREATE TABLE "user_permission_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"modul_key" varchar(50) NOT NULL,
	"granted" boolean NOT NULL,
	"catatan" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kebijakan_pengaduan" (
	"id" text PRIMARY KEY NOT NULL,
	"versi" integer NOT NULL,
	"status" "status_kebijakan_enum" DEFAULT 'DRAFT' NOT NULL,
	"nomor_sk" varchar(100),
	"alasan_perubahan" text,
	"tanggal_berlaku" timestamp DEFAULT now() NOT NULL,
	"config" jsonb NOT NULL,
	"dibuat_oleh" text,
	"disetujui_oleh" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kebijakan_pengaduan_versi_unique" UNIQUE("versi")
);
--> statement-breakpoint
CREATE TABLE "capaian_pengaturan" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"wilayah_id" varchar(20) NOT NULL,
	"tahun" integer NOT NULL,
	"hari_acuan_lps" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capaian_pengaturan_wilayah_tahun_idx" UNIQUE("wilayah_id","tahun")
);
--> statement-breakpoint
CREATE TABLE "capaian_realisasi_bulanan" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"wilayah_id" varchar(20) NOT NULL,
	"tahun" integer NOT NULL,
	"bulan" integer NOT NULL,
	"realisasi_sl" integer DEFAULT 0 NOT NULL,
	"realisasi_m3" numeric(14, 2) DEFAULT '0' NOT NULL,
	"sumber" varchar(20) DEFAULT 'OTOMATIS' NOT NULL,
	"dikunci" boolean DEFAULT false NOT NULL,
	"versi" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capaian_realisasi_bulanan_wilayah_tahun_bulan_idx" UNIQUE("wilayah_id","tahun","bulan")
);
--> statement-breakpoint
CREATE TABLE "capaian_riwayat" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"wilayah_id" varchar(20) NOT NULL,
	"tahun" integer NOT NULL,
	"aksi" varchar(50) NOT NULL,
	"data_sebelum" jsonb,
	"data_sesudah" jsonb,
	"diubah_oleh" varchar(100) DEFAULT 'SYSTEM' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capaian_target_bulanan" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"wilayah_id" varchar(20) NOT NULL,
	"tahun" integer NOT NULL,
	"bulan" integer NOT NULL,
	"target_sl" integer DEFAULT 0 NOT NULL,
	"target_m3" numeric(14, 2) DEFAULT '0' NOT NULL,
	"versi" integer DEFAULT 1 NOT NULL,
	"catatan" text,
	"diubah_oleh" varchar(100) DEFAULT 'SYSTEM' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capaian_target_bulanan_wilayah_tahun_bulan_idx" UNIQUE("wilayah_id","tahun","bulan")
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "direksi" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "senior_manager" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "manager" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "supervisor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "staff" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pengaduan" ADD COLUMN "kebijakan_versi" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kebijakan_pengaduan" ADD CONSTRAINT "kebijakan_pengaduan_dibuat_oleh_user_id_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kebijakan_pengaduan" ADD CONSTRAINT "kebijakan_pengaduan_disetujui_oleh_user_id_fk" FOREIGN KEY ("disetujui_oleh") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_permission_overrides_user_id_idx" ON "user_permission_overrides" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permission_overrides_modul_key_idx" ON "user_permission_overrides" USING btree ("modul_key");--> statement-breakpoint
CREATE INDEX "kebijakan_pengaduan_versi_idx" ON "kebijakan_pengaduan" USING btree ("versi");--> statement-breakpoint
CREATE INDEX "kebijakan_pengaduan_status_idx" ON "kebijakan_pengaduan" USING btree ("status");