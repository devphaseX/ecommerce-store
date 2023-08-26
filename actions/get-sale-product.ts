import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { Stores, orders } from '../schema';

const getTotalSales = (storeId: Stores['id']) => {
  return db
    .select()
    .from(orders)
    .where(
      sql`${orders.madePayment} = ${true} and ${orders.storeId} = ${storeId}`
    );
};

export { getTotalSales };
