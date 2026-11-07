CREATE TABLE "area_layanan" (
	"kode_desa" varchar(20) PRIMARY KEY NOT NULL,
	"kelurahan" varchar(100) NOT NULL,
	"kecamatan" varchar(100) NOT NULL,
	"geometry" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
