import { db } from '@/config/db/neon/initialize';
import { Stores, orderItems, orders, products } from '../schema';
import { eq, sql } from 'drizzle-orm';

const getTotalRevenue = async (storeId: Stores['id']) => {
  const [{ totalRevenue }] = await db
    .select({ totalRevenue: sql<number>`sum(${products.price})` })
    .from(orders)
    .where(
      sql`${orders.madePayment} = ${true} and ${orders.storeId} = ${storeId}`
    )
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .groupBy(orders.id);

  return totalRevenue;
};

export { getTotalRevenue };
