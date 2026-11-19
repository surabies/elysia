CREATE TABLE IF NOT EXISTS "pengaturan_konten" (
	"kunci" varchar(100) PRIMARY KEY NOT NULL,
	"nilai" jsonb NOT NULL,
	"kategori" varchar(50) DEFAULT 'umum' NOT NULL,
	"keterangan" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipa_jaringan" (
	"id" integer PRIMARY KEY NOT NULL,
	"fid" integer,
	"kode_pipa" varchar(100),
	"jenis_pipa" varchar(100),
	"material" varchar(100),
	"diameter" varchar(100),
	"diameter_dalam" varchar(100),
	"kedalaman" varchar(100),
	"tahun_pasang" varchar(50),
	"tahun_ganti" varchar(50),
	"lokasi" text,
	"pelaksana" varchar(150),
	"pelayanan" varchar(100),
	"jenis_jaringan" varchar(100),
	"jenis_material" varchar(150),
	"sumber_data" varchar(100),
	"posisi_pipa" varchar(100),
	"fungsi" varchar(100),
	"steptest" varchar(100),
	"jaringan_dma" varchar(100),
	"dma" varchar(100),
	"sumber_air" varchar(150),
	"petugas_update" varchar(150),
	"panjang_meter" double precision,
	"status_pipa" varchar(100),
	"keterangan" text,
	"geometry" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sumber_air" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"nama" varchar(150) NOT NULL,
	"tipe" varchar(50) NOT NULL,
	"wilayah" varchar(100),
	"kapasitas_lps" double precision,
	"status" varchar(50) DEFAULT 'Aktif' NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "wilayah" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "zona" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "jumlah_kk" integer;--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "pelanggan" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "topografi" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "potensi" text;--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "bangunan" text;--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "sumber_air" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "durasi" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "luas_area" varchar(100);--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "latitude" double precision;--> statement-breakpoint
ALTER TABLE "area_layanan" ADD COLUMN IF NOT EXISTS "longitude" double precision;--> statement-breakpoint
ALTER TABLE "broadcast" ADD COLUMN IF NOT EXISTS "lokasi_wilayah" varchar(100) DEFAULT 'Pelayanan Wilayah 5';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipa_pelayanan_idx" ON "pipa_jaringan" USING btree ("pelayanan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipa_material_idx" ON "pipa_jaringan" USING btree ("material");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipa_dma_idx" ON "pipa_jaringan" USING btree ("dma");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipa_sumber_air_idx" ON "pipa_jaringan" USING btree ("sumber_air");
