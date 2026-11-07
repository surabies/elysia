import { pgTable, text, timestamp, index, geometry, varchar, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';

export interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export const areaLayanan = pgTable('area_layanan', {
  kodeDesa: varchar('kode_desa', { length: 20 }).primaryKey(),
  kelurahan: varchar('kelurahan', { length: 100 }).notNull(),
  kecamatan: varchar('kecamatan', { length: 100 }).notNull(),
  geometry: jsonb('geometry').$type<MultiPolygonGeometry>(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const places = pgTable(
  'places',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('places_location_idx').using('gist', table.location),
    index('places_user_id_idx').on(table.userId),
  ]
);

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
