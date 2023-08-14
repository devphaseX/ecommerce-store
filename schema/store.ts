import { InferModel, relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { billBoards } from './bill-board';
import { categories } from './category';

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).unique().notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Stores = InferModel<typeof stores>;

export const storeRelations = relations(stores, ({ many }) => ({
  billBoards: many(billBoards),
  categories: many(categories),
}));
