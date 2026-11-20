ALTER TABLE "golongan_tarif" ADD COLUMN "pemakaian_minimum_m3" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "master_kondisi_catat" ADD COLUMN "mode_hitung" varchar(30) DEFAULT 'SELISIH_FISIK' NOT NULL;--> statement-breakpoint
ALTER TABLE "daftar_catat" ADD COLUMN "akumulasi_taksasi_m3" numeric(10, 2) DEFAULT '0' NOT NULL;