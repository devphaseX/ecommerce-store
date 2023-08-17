import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { products } from './product';
import { InferModel, relations } from 'drizzle-orm';

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const imageRelations = relations(images, ({ one }) => ({
  ownedProduct: one(products, {
    fields: [images.productId],
    references: [products.id],
  }),
}));

export type Image = InferModel<typeof images>;
