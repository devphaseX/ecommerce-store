import {
  boolean,
  decimal,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { stores } from './store';
import { Category, categories } from './category';
import { Sizes, sizes } from './size';
import { Colours, colours } from './colour';
import { InferModel, relations } from 'drizzle-orm';
import { images } from './image';
import { createInsertSchema } from 'drizzle-zod';
import { TypeOf, array, number, object, string, z } from 'zod';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  name: varchar('name', { length: 256 }).notNull(),
  price: decimal('price', { scale: 2 }).notNull(),
  isFeatured: boolean('is_featured').default(false),
  isArchieved: boolean('is_archived').default(false),
  sizeId: uuid('size_id')
    .notNull()
    .references(() => sizes.id),
  colourId: uuid('colour_id')
    .notNull()
    .references(() => colours.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const productRelations = relations(products, ({ many, one }) => ({
  images: many(images),
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  colour: one(colours, {
    fields: [products.colourId],
    references: [colours.id],
  }),

  size: one(sizes, {
    fields: [products.sizeId],
    references: [sizes.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const createProductSchema = createInsertSchema(products, {
  name: string().nonempty().max(256),
  price: number({ coerce: true })
    .positive()
    .transform((price) => price.toFixed(2)),
  isFeatured: z.boolean().default(false),
  isArchieved: z.boolean().default(false),
  colourId: z.string().uuid(),
  sizeId: z.string().uuid(),
  categoryId: z.string().uuid(),
})
  .extend({
    images: array(
      object({ id: string().uuid().optional(), url: string().url() })
    ).nonempty({ message: 'Image is required' }),
  })
  .omit({ id: true, storeId: true, createdAt: true, updatedAt: true });

export type CreateProduct = TypeOf<typeof createProductSchema>;

export type ResponseProduct = Pick<
  Products,
  'id' | 'name' | 'price' | 'isArchieved' | 'isFeatured'
> & {
  category: Category['name'];
  size: Sizes['name'];
  colour: Colours['value'];
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type Products = InferModel<typeof products>;
