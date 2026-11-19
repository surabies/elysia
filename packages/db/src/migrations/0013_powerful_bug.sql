ALTER TABLE "user" ADD COLUMN "nolg" varchar(20);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_nolg_pelanggan_nolg_fk" FOREIGN KEY ("nolg") REFERENCES "public"."pelanggan"("nolg") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_nolg_idx" ON "user" USING btree ("nolg");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_nolg_unique" UNIQUE("nolg");