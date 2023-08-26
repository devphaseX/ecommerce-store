import { db } from '@/config/db/neon/initialize';
import { Stores, orderItems, orders, products } from '../schema';
import { eq, sql } from 'drizzle-orm';

const result: {
  name: string;
  total: number;
}[] = [
  { name: 'JAN', total: 0 },
  { name: 'FEB', total: 0 },
  { name: 'MAR', total: 0 },
  { name: 'APR', total: 0 },
  { name: 'MAY', total: 0 },
  { name: 'JUN', total: 0 },
  { name: 'JUL', total: 0 },
  { name: 'AUG', total: 0 },
  { name: 'SEP', total: 0 },
  { name: 'OCT', total: 0 },
  { name: 'NOV', total: 0 },
  { name: 'DEC', total: 0 },
];

const getGraphRevenue = async (storeId: Stores['id']) => {
  const dbResults = await db
    .select({
      name: sql<string>`to_char(${orders.createdAt}, 'Mon')`.as('month'),
      total: sql<number>`SUM(${products.price})`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      sql`${orders.storeId} = ${storeId} and ${orders.madePayment} = ${true}`
    )
    .groupBy(sql`to_char(${orders.createdAt}, 'Mon')`);

  return result.map(
    (item) =>
      dbResults.find(
        ({ name }) => name.toLowerCase() === item.name.toLowerCase()
      ) ?? item
  );
};

export { getGraphRevenue };
