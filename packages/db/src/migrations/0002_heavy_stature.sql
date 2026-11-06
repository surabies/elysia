CREATE TYPE "public"."app_role" AS ENUM('SUPERADMIN', 'EXECUTIVE', 'VERIFIKATOR_3', 'VERIFIKATOR_2', 'VERIFIKATOR_1', 'STAFF_ADMIN_BILLING', 'PENCATAT');--> statement-breakpoint
CREATE TYPE "public"."cater_verification_status" AS ENUM('DRAFT', 'SUBMITTED', 'NEED_RESURVEY', 'VERIFIED_L1', 'VERIFIED_L2', 'APPROVED_FINAL', 'CORRECTED_POST_VERIF', 'LOCKED_BILLING');--> statement-breakpoint
CREATE TYPE "public"."employee_level" AS ENUM('DIREKSI', 'SENIOR_MANAGER', 'MANAGER', 'SUPERVISOR', 'STAFF_PENYELIA', 'PELAKSANA');--> statement-breakpoint
CREATE TABLE "cater_verifikasi_log" (
	"id" text PRIMARY KEY NOT NULL,
	"cater_id" text NOT NULL,
	"user_id" text NOT NULL,
	"stage" varchar(20) NOT NULL,
	"action" varchar(30) NOT NULL,
	"stma_sebelum" numeric(10, 2),
	"stma_sesudah" numeric(10, 2),
	"pakai_sebelum" numeric(10, 2),
	"pakai_sesudah" numeric(10, 2),
	"nomor_tiket_komplain" varchar(50),
	"alasan" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pegawai" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"nip" varchar(30) NOT NULL,
	"nama_lengkap" varchar(150) NOT NULL,
	"level" "employee_level" DEFAULT 'PELAKSANA' NOT NULL,
	"jabatan_nama" varchar(100),
	"unit_kerja" varchar(100),
	"atasan_id" text,
	"no_hp" varchar(30),
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pegawai_nip_unique" UNIQUE("nip")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role" "app_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "user_rute_assignment" (
	"user_id" text NOT NULL,
	"rute_kode" varchar(20) NOT NULL,
	"periode_thbl" varchar(6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_rute_assignment_user_id_rute_kode_periode_thbl_pk" PRIMARY KEY("user_id","rute_kode","periode_thbl")
);
--> statement-breakpoint
CREATE TABLE "user_wilayah_scope" (
	"user_id" text NOT NULL,
	"wiladm_kode" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_wilayah_scope_user_id_wiladm_kode_pk" PRIMARY KEY("user_id","wiladm_kode")
);
--> statement-breakpoint
ALTER TABLE "cater_verifikasi_log" ADD CONSTRAINT "cater_verifikasi_log_cater_id_cater_baca_meter_id_fk" FOREIGN KEY ("cater_id") REFERENCES "public"."cater_baca_meter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cater_verifikasi_log" ADD CONSTRAINT "cater_verifikasi_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai" ADD CONSTRAINT "pegawai_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pegawai" ADD CONSTRAINT "pegawai_atasan_id_pegawai_id_fk" FOREIGN KEY ("atasan_id") REFERENCES "public"."pegawai"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rute_assignment" ADD CONSTRAINT "user_rute_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rute_assignment" ADD CONSTRAINT "user_rute_assignment_rute_kode_rute_cater_kode_fk" FOREIGN KEY ("rute_kode") REFERENCES "public"."rute_cater"("kode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wilayah_scope" ADD CONSTRAINT "user_wilayah_scope_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wilayah_scope" ADD CONSTRAINT "user_wilayah_scope_wiladm_kode_wilayah_administrasi_kode_fk" FOREIGN KEY ("wiladm_kode") REFERENCES "public"."wilayah_administrasi"("kode") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cater_verifikasi_log_cater_id_idx" ON "cater_verifikasi_log" USING btree ("cater_id");--> statement-breakpoint
CREATE INDEX "cater_verifikasi_log_user_id_idx" ON "cater_verifikasi_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pegawai_nip_idx" ON "pegawai" USING btree ("nip");--> statement-breakpoint
CREATE INDEX "pegawai_user_id_idx" ON "pegawai" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pegawai_level_idx" ON "pegawai" USING btree ("level");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_rute_assignment_user_id_idx" ON "user_rute_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_rute_assignment_thbl_rute_idx" ON "user_rute_assignment" USING btree ("periode_thbl","rute_kode");--> statement-breakpoint
CREATE INDEX "user_wilayah_scope_user_id_idx" ON "user_wilayah_scope" USING btree ("user_id");