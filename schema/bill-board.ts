import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { stores } from './store';
import { InferModel, relations } from 'drizzle-orm';

export const billBoards = pgTable('bill-boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .references(() => stores.id)
    .notNull(),
  label: varchar('label', { length: 256 }).notNull(),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type BillBoard = InferModel<typeof billBoards>;

export const billBoardRelations = relations(billBoards, ({ one }) => ({
  store: one(stores, { fields: [billBoards.storeId], references: [stores.id] }),
}));
