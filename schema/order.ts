import { pgTable, uuid } from 'drizzle-orm/pg-core';
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
});
