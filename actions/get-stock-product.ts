import { db } from '@/config/db/neon/initialize';
import { Stores, orders, products } from '../schema';
import { sql } from 'drizzle-orm';

const getProductsInStockCount = (storeId: Stores['id']) => {
  return db
    .select()
    .from(products)
    .where(
      sql`${products.isArchieved} = ${false} and ${
        products.storeId
      } = ${storeId}`
    );
};

export { getProductsInStockCount };
