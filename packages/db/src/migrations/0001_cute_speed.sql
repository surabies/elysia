CREATE TABLE "kecamatan" (
	"kode" varchar(10) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"wiladm_kode" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "kelurahan" (
	"kode" varchar(10) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"kecamatan_kode" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "petugas_cater" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"no_hp" varchar(30),
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rute_cater" (
	"kode" varchar(20) PRIMARY KEY NOT NULL,
	"seksi_kode" varchar(20),
	"seksi_nama" varchar(100),
	"pencatat_default" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "wilayah_administrasi" (
	"kode" varchar(10) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zona_distribusi" (
	"kode" varchar(20) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"wildist_kode" varchar(20),
	"wildist_nama" varchar(100),
	"dma_kode" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "golongan_tarif" (
	"kode" varchar(10) PRIMARY KEY NOT NULL,
	"nama" varchar(100) NOT NULL,
	"bea_beban" numeric(12, 2) DEFAULT '0',
	"bea_admin" numeric(12, 2) DEFAULT '0',
	"air_kotor" numeric(12, 2) DEFAULT '0',
	"lain_lain" numeric(12, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "water_meter" (
	"no_meter" varchar(50) PRIMARY KEY NOT NULL,
	"merk" varchar(50),
	"ukuran" varchar(20) DEFAULT '1/2',
	"no_segel" varchar(50),
	"tgl_pasang" timestamp,
	"umur_tahun" integer DEFAULT 0,
	"umur_bulan" integer DEFAULT 0,
	"kondisi" varchar(50) DEFAULT 'Normal'
);
--> statement-breakpoint
CREATE TABLE "pelanggan" (
	"nolg" varchar(20) PRIMARY KEY NOT NULL,
	"nprs" varchar(30),
	"nama" varchar(150) NOT NULL,
	"alamat" text NOT NULL,
	"rt" varchar(10),
	"rw" varchar(10),
	"no_telp" varchar(30),
	"jml_penghuni" integer DEFAULT 0,
	"is_mbr" boolean DEFAULT false NOT NULL,
	"status" varchar(30) DEFAULT 'PELANGGAN AKTIF' NOT NULL,
	"tarif_kode" varchar(10),
	"kelurahan_kode" varchar(10),
	"rute_kode" varchar(20),
	"no_urut_rute" integer DEFAULT 0,
	"no_meter" varchar(50),
	"titik_lokasi" geometry(point),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cater_baca_meter" (
	"id" text PRIMARY KEY NOT NULL,
	"thbl" varchar(6) NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"rute_kode" varchar(20),
	"petugas_id" varchar(50),
	"stml" numeric(10, 2) NOT NULL,
	"stma" numeric(10, 2) NOT NULL,
	"pakai_m3" numeric(10, 2) NOT NULL,
	"pakai_lalu" numeric(10, 2),
	"ket_catat" varchar(50) DEFAULT 'Normal' NOT NULL,
	"metode_catat" varchar(20) DEFAULT 'ONSITE' NOT NULL,
	"tgl_catat" timestamp DEFAULT now() NOT NULL,
	"durasi_detik" integer DEFAULT 0,
	"foto_meter_url" text,
	"foto_rumah_url" text,
	"lokasi_gps" geometry(point),
	"jarak_pelanggan_meter" numeric(8, 2),
	"status_verifikasi" varchar(30) DEFAULT 'SUBMITTED' NOT NULL,
	"catatan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rekening_drd" (
	"id" text PRIMARY KEY NOT NULL,
	"thbl" varchar(6) NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"pakai_m3" numeric(10, 2) DEFAULT '0',
	"blok_m3" integer DEFAULT 1,
	"jml_harga_air" numeric(12, 2) DEFAULT '0',
	"bea_beban" numeric(12, 2) DEFAULT '0',
	"bea_admin" numeric(12, 2) DEFAULT '0',
	"air_kotor" numeric(12, 2) DEFAULT '0',
	"lain_lain" numeric(12, 2) DEFAULT '0',
	"total_tagihan" numeric(12, 2) DEFAULT '0' NOT NULL,
	"jml_rek_nunggak" integer DEFAULT 0,
	"tag_nunggak" numeric(12, 2) DEFAULT '0',
	"potensial_penagihan" varchar(50),
	"potensial_cater" varchar(50),
	"status_lunas" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kecamatan" ADD CONSTRAINT "kecamatan_wiladm_kode_wilayah_administrasi_kode_fk" FOREIGN KEY ("wiladm_kode") REFERENCES "public"."wilayah_administrasi"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kelurahan" ADD CONSTRAINT "kelurahan_kecamatan_kode_kecamatan_kode_fk" FOREIGN KEY ("kecamatan_kode") REFERENCES "public"."kecamatan"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rute_cater" ADD CONSTRAINT "rute_cater_pencatat_default_petugas_cater_id_fk" FOREIGN KEY ("pencatat_default") REFERENCES "public"."petugas_cater"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_tarif_kode_golongan_tarif_kode_fk" FOREIGN KEY ("tarif_kode") REFERENCES "public"."golongan_tarif"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_kelurahan_kode_kelurahan_kode_fk" FOREIGN KEY ("kelurahan_kode") REFERENCES "public"."kelurahan"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_rute_kode_rute_cater_kode_fk" FOREIGN KEY ("rute_kode") REFERENCES "public"."rute_cater"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggan" ADD CONSTRAINT "pelanggan_no_meter_water_meter_no_meter_fk" FOREIGN KEY ("no_meter") REFERENCES "public"."water_meter"("no_meter") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_baca_meter_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_baca_meter_rute_kode_rute_cater_kode_fk" FOREIGN KEY ("rute_kode") REFERENCES "public"."rute_cater"("kode") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ADD CONSTRAINT "cater_baca_meter_petugas_id_petugas_cater_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."petugas_cater"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rekening_drd" ADD CONSTRAINT "rekening_drd_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pelanggan_titik_lokasi_idx" ON "pelanggan" USING gist ("titik_lokasi");--> statement-breakpoint
CREATE INDEX "pelanggan_rute_kode_idx" ON "pelanggan" USING btree ("rute_kode");--> statement-breakpoint
CREATE INDEX "pelanggan_tarif_kode_idx" ON "pelanggan" USING btree ("tarif_kode");--> statement-breakpoint
CREATE INDEX "pelanggan_kelurahan_kode_idx" ON "pelanggan" USING btree ("kelurahan_kode");--> statement-breakpoint
CREATE INDEX "cater_thbl_nolg_idx" ON "cater_baca_meter" USING btree ("thbl","nolg");--> statement-breakpoint
CREATE INDEX "cater_rute_kode_idx" ON "cater_baca_meter" USING btree ("rute_kode");--> statement-breakpoint
CREATE INDEX "cater_petugas_idx" ON "cater_baca_meter" USING btree ("petugas_id");--> statement-breakpoint
CREATE INDEX "cater_lokasi_gps_idx" ON "cater_baca_meter" USING gist ("lokasi_gps");--> statement-breakpoint
CREATE INDEX "cater_status_verifikasi_idx" ON "cater_baca_meter" USING btree ("status_verifikasi");--> statement-breakpoint
CREATE INDEX "drd_thbl_nolg_idx" ON "rekening_drd" USING btree ("thbl","nolg");--> statement-breakpoint
CREATE INDEX "drd_status_lunas_idx" ON "rekening_drd" USING btree ("status_lunas");