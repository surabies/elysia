import { pgTable, text, timestamp, index, geometry } from 'drizzle-orm/pg-core';
import { user } from './auth';

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
