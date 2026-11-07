CREATE TYPE "public"."aksi_pengaduan_enum" AS ENUM('DIBUAT', 'DITUGASKAN', 'STATUS_DIUBAH', 'CATATAN', 'ESKALASI', 'DIKONFIRMASI', 'DIBUKA_KEMBALI', 'DINILAI', 'DIVERIFIKASI', 'CHAT', 'DITUTUP_OTOMATIS');--> statement-breakpoint
CREATE TYPE "public"."jenis_pengaduan_enum" AS ENUM('LAPOR_STAND_METER', 'MUTASI_GOLONGAN_TARIF', 'TIDAK_MAMPU_BAYAR', 'PENCATATAN_METER_TIDAK_SESUAI', 'LONJAKAN_PEMAKAIAN_AIR', 'GANTI_STOP_KRAN', 'BOCOR_PIPA_DINAS', 'PASANGAN_LIAR', 'TIDAK_ADA_AIR', 'AIR_KERUH_BAU_BERWARNA', 'PINDAH_JARINGAN', 'LAINNYA');--> statement-breakpoint
CREATE TYPE "public"."klasifikasi_pengaduan_enum" AS ENUM('NILAI_TAGIHAN_REKENING', 'BUKAN_NILAI_TAGIHAN_REKENING');--> statement-breakpoint
CREATE TYPE "public"."prioritas_pengaduan_enum" AS ENUM('RENDAH', 'NORMAL', 'TINGGI', 'DARURAT');--> statement-breakpoint
CREATE TYPE "public"."status_pengaduan_enum" AS ENUM('BARU', 'TERVERIFIKASI', 'DITUGASKAN', 'MENUJU_LOKASI', 'DIPROSES', 'MENUNGGU_PELANGGAN', 'SELESAI', 'DITUTUP', 'DITOLAK', 'DIBUKA_KEMBALI');--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'PELAKSANA';--> statement-breakpoint
ALTER TYPE "public"."app_role" ADD VALUE 'USER';--> statement-breakpoint
CREATE TABLE "drd_cakupan_penduduk" (
	"kelurahan_kode" varchar(10) PRIMARY KEY NOT NULL,
	"jumlah_penduduk" integer NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drd_cakupan_penduduk_nonnegative" CHECK ("drd_cakupan_penduduk"."jumlah_penduduk" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pengaduan" (
	"id" text PRIMARY KEY NOT NULL,
	"nomor_tiket" varchar(30) NOT NULL,
	"client_request_id" varchar(100),
	"pelanggan_id" varchar(20),
	"nomor_langganan" varchar(20),
	"klasifikasi" "klasifikasi_pengaduan_enum" DEFAULT 'BUKAN_NILAI_TAGIHAN_REKENING' NOT NULL,
	"jenis" "jenis_pengaduan_enum" NOT NULL,
	"judul" varchar(255) NOT NULL,
	"deskripsi" text NOT NULL,
	"koordinat" geometry(point),
	"alamat_kejadian" text,
	"prioritas" "prioritas_pengaduan_enum" DEFAULT 'NORMAL' NOT NULL,
	"status" "status_pengaduan_enum" DEFAULT 'BARU' NOT NULL,
	"pelapor" varchar(150) NOT NULL,
	"kontak_pelapor" varchar(50),
	"foto_url" text,
	"foto_public_id" varchar(255),
	"video_url" text,
	"video_public_id" varchar(255),
	"ditugaskan_ke_id" text,
	"ditangani_mulai" timestamp,
	"selesai_at" timestamp,
	"catatan_penyelesaian" text,
	"foto_penyelesaian_url" text,
	"foto_penyelesaian_public_id" varchar(255),
	"target_respons_at" timestamp,
	"target_selesai_at" timestamp,
	"respons_at" timestamp,
	"jeda_mulai_at" timestamp,
	"jeda_total_menit" integer DEFAULT 0 NOT NULL,
	"rating_kepuasan" integer,
	"komentar_kepuasan" text,
	"rating_at" timestamp,
	"jumlah_dibuka_kembali" integer DEFAULT 0 NOT NULL,
	"konfirmasi_batas_at" timestamp,
	"verifikasi_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pengaduan_nomor_tiket_unique" UNIQUE("nomor_tiket"),
	CONSTRAINT "pengaduan_client_request_id_unique" UNIQUE("client_request_id")
);
--> statement-breakpoint
CREATE TABLE "riwayat_pengaduan" (
	"id" text PRIMARY KEY NOT NULL,
	"pengaduan_id" text NOT NULL,
	"aksi" "aksi_pengaduan_enum" NOT NULL,
	"status_dari" "status_pengaduan_enum",
	"status_ke" "status_pengaduan_enum",
	"petugas_id" text,
	"catatan" text,
	"foto_url" text,
	"foto_public_id" varchar(255),
	"is_publik" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drd_cakupan_penduduk" ADD CONSTRAINT "drd_cakupan_penduduk_kelurahan_kode_kelurahan_kode_fk" FOREIGN KEY ("kelurahan_kode") REFERENCES "public"."kelurahan"("kode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drd_cakupan_penduduk" ADD CONSTRAINT "drd_cakupan_penduduk_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_pelanggan_id_pelanggan_nolg_fk" FOREIGN KEY ("pelanggan_id") REFERENCES "public"."pelanggan"("nolg") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_ditugaskan_ke_id_user_id_fk" FOREIGN KEY ("ditugaskan_ke_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_pengaduan" ADD CONSTRAINT "riwayat_pengaduan_pengaduan_id_pengaduan_id_fk" FOREIGN KEY ("pengaduan_id") REFERENCES "public"."pengaduan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_pengaduan" ADD CONSTRAINT "riwayat_pengaduan_petugas_id_user_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pengaduan_nomor_tiket_idx" ON "pengaduan" USING btree ("nomor_tiket");--> statement-breakpoint
CREATE INDEX "pengaduan_pelanggan_idx" ON "pengaduan" USING btree ("pelanggan_id");--> statement-breakpoint
CREATE INDEX "pengaduan_nomor_langganan_idx" ON "pengaduan" USING btree ("nomor_langganan");--> statement-breakpoint
CREATE INDEX "pengaduan_jenis_status_idx" ON "pengaduan" USING btree ("jenis","status");--> statement-breakpoint
CREATE INDEX "pengaduan_status_prioritas_idx" ON "pengaduan" USING btree ("status","prioritas");--> statement-breakpoint
CREATE INDEX "pengaduan_created_at_idx" ON "pengaduan" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pengaduan_ditugaskan_idx" ON "pengaduan" USING btree ("ditugaskan_ke_id");--> statement-breakpoint
CREATE INDEX "pengaduan_koordinat_idx" ON "pengaduan" USING gist ("koordinat");--> statement-breakpoint
CREATE INDEX "riwayat_pengaduan_id_idx" ON "riwayat_pengaduan" USING btree ("pengaduan_id");--> statement-breakpoint
CREATE INDEX "riwayat_pengaduan_created_at_idx" ON "riwayat_pengaduan" USING btree ("created_at");