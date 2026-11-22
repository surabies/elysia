CREATE TABLE IF NOT EXISTS "pengaduan_nomor_urut" (
	"prefix" varchar(20) PRIMARY KEY NOT NULL,
	"last_urut" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "riwayat_pengaduan" ADD COLUMN IF NOT EXISTS "petugas_tujuan_id" text;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "riwayat_pengaduan" ADD CONSTRAINT "riwayat_pengaduan_petugas_tujuan_id_user_id_fk" FOREIGN KEY ("petugas_tujuan_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "riwayat_pengaduan_petugas_tujuan_idx" ON "riwayat_pengaduan" USING btree ("petugas_tujuan_id");
