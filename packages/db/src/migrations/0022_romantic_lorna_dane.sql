CREATE TABLE "mutasi_rute" (
	"id" text PRIMARY KEY NOT NULL,
	"batch_id" text NOT NULL,
	"tipe" varchar(20) NOT NULL,
	"nolg" varchar(20) NOT NULL,
	"nama_pelanggan" varchar(150) NOT NULL,
	"tgl_pasang" varchar(30),
	"wilayah_lama" varchar(50) NOT NULL,
	"rute_lama" varchar(20) NOT NULL,
	"urut_lama" integer NOT NULL,
	"wilayah_baru" varchar(50) NOT NULL,
	"rute_baru" varchar(20) NOT NULL,
	"urut_baru" integer NOT NULL,
	"zona_baru" varchar(50),
	"input_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rute_cater" ADD COLUMN "status_sementara" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rute_cater" ADD COLUMN "no_urut" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "pegawai" ADD COLUMN "bagian" varchar(50) DEFAULT 'UMUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "pegawai" ADD COLUMN "wilayah_kerja" varchar(50) DEFAULT 'WILAYAH_5' NOT NULL;--> statement-breakpoint
ALTER TABLE "mutasi_rute" ADD CONSTRAINT "mutasi_rute_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_rute" ADD CONSTRAINT "mutasi_rute_rute_lama_rute_cater_kode_fk" FOREIGN KEY ("rute_lama") REFERENCES "public"."rute_cater"("kode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutasi_rute" ADD CONSTRAINT "mutasi_rute_rute_baru_rute_cater_kode_fk" FOREIGN KEY ("rute_baru") REFERENCES "public"."rute_cater"("kode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mutasi_rute_batch_id_idx" ON "mutasi_rute" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "mutasi_rute_nolg_idx" ON "mutasi_rute" USING btree ("nolg");--> statement-breakpoint
CREATE INDEX "mutasi_rute_rute_baru_idx" ON "mutasi_rute" USING btree ("rute_baru");--> statement-breakpoint
CREATE INDEX "mutasi_rute_created_at_idx" ON "mutasi_rute" USING btree ("created_at");