import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const image = pgTable('image', {
  id: uuid('id')
    .default(sql`pg_catalog.gen_random_uuid()`)
    .primaryKey(),
  assetId: text('asset_id').notNull(),
  ownerId: uuid('owner_id').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
