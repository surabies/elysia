import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { kelurahan } from "./wilayah";

export const drdCakupanPenduduk = pgTable(
  "drd_cakupan_penduduk",
  {
    kelurahanKode: varchar("kelurahan_kode", { length: 10 })
      .primaryKey()
      .references(() => kelurahan.kode, { onDelete: "cascade" }),
    jumlahPenduduk: integer("jumlah_penduduk").notNull(),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "drd_cakupan_penduduk_nonnegative",
      sql`${table.jumlahPenduduk} >= 0`,
    ),
  ],
);
