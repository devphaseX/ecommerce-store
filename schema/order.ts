import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { stores } from './store';
import { InferModel, relations } from 'drizzle-orm';
import { orderItems } from './orderItem';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .references(() => stores.id)
    .notNull(),

  madePayment: boolean('made_payment').default(false).notNull(),
  phoneNo: varchar('phone_no', { length: 32 }).default(''),
  address: varchar('address', { length: 256 }).default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Order = InferModel<typeof orders>;

export const orderRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}));
