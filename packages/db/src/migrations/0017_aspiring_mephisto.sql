CREATE TABLE "riwayat_pemakaian_historis" (
	"id" text PRIMARY KEY NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"periode" varchar(6) NOT NULL,
	"stand_awal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"stand_akhir" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pakai_m3" numeric(10, 2) DEFAULT '0' NOT NULL,
	"kode_kondisi" varchar(10) DEFAULT '-',
	"nama_kondisi" varchar(50) DEFAULT 'Normal',
	"is_taksasi" boolean DEFAULT false NOT NULL,
	"sumber" varchar(50) DEFAULT 'INFOLANG' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "riwayat_pemakaian_periode_nolg_unique" UNIQUE("periode","nolg")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "wajib_ganti_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "golongan_tarif" ADD COLUMN "tagihan_saat_kelebihan" varchar(20) DEFAULT 'MINIMUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD COLUMN "akumulasi_perlu_verifikasi" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "riwayat_pemakaian_historis" ADD CONSTRAINT "riwayat_pemakaian_historis_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "riwayat_pemakaian_nolg_periode_idx" ON "riwayat_pemakaian_historis" USING btree ("nolg","periode");