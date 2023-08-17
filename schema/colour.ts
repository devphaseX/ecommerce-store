import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { stores } from './store';
import { InferModel, relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { string } from 'zod';

export const colours = pgTable('colours', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id),
  name: varchar('name', { length: 54 }).notNull(),
  value: varchar('value', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const colourRelations = relations(colours, ({ one }) => ({
  ownedStore: one(stores, {
    fields: [colours.storeId],
    references: [stores.id],
  }),
}));

export const requestColourCreateSchema = createInsertSchema(colours, {
  name: string().max(54).nonempty(),
  value: string().max(7).nonempty(),
}).pick({ name: true, value: true });

export type Colours = InferModel<typeof colours>;
