import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { stores } from './store';
import { relations, InferModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

const sizes = pgTable('sizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id),
  name: varchar('name', { length: 256 }).notNull(),
  value: varchar('value', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const sizeRelations = relations(sizes, ({ one }) => ({
  ownedStore: one(stores, { fields: [sizes.storeId], references: [stores.id] }),
}));

const insertSizeSchema = createInsertSchema(sizes, {
  name: (schema) => schema.name.nonempty(),
  value: (schema) => schema.value.nonempty(),
});

type Sizes = InferModel<typeof sizes>;
export type { Sizes };
export { sizes, sizeRelations, insertSizeSchema };
