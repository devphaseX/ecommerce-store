import { InferModel, relations } from 'drizzle-orm';
import { pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { orders } from './order';
import { products } from './product';

export const orderItems = pgTable(
  'orderItems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),

    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
  },
  ({ orderId, productId }) => ({
    uq: uniqueIndex('product_order').on(orderId, productId),
  })
);

export const ordersRelation = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type OrderItem = InferModel<typeof orderItems>;
