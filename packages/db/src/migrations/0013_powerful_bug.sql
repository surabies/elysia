ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "nolg" varchar(20);--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_nolg_pelanggan_nolg_fk'
  ) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_nolg_idx" ON "user" USING btree ("nolg");--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_nolg_unique'
  ) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_nolg_unique" UNIQUE("nolg");
  END IF;
END $$;