import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { stores } from './store';
import { InferModel, relations } from 'drizzle-orm';
import { billBoards } from './bill-board';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id),
  billboardId: uuid('billboard_id').references(() => billBoards.id),
  name: text('name').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one }) => ({
  ownedStore: one(stores, {
    fields: [categories.storeId],
    references: [stores.id],
  }),

  bilboard: one(billBoards, {
    fields: [categories.billboardId],
    references: [billBoards.id],
  }),
}));

export type Category = InferModel<typeof categories>;
