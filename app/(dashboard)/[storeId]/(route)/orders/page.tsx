import { auth } from '@clerk/nextjs';
import { OrderClient } from './components/order-board-client';
import { notFound, redirect } from 'next/navigation';
import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { db } from '@/config/db/neon/initialize';
import { and, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';

import { orderItems, orders, products } from '@/schema/index';

export const revalidate = 0;
interface OrderPageProps {
  params: ParamWithStoreId;
}

const OrdersPage = async ({ params: { storeId } }: OrderPageProps) => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const [store, queriedOrders] = await Promise.all([
    db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.userId, userId)),
    }),

    db
      .select({
        id: orders.id,
        madePayments: orders.madePayment,
        address: orders.address,
        phoneNo: orders.phoneNo,
        storeId: orders.storeId,
        totalPrice: sql<number>`sum(${products.price})`,
        productNames: sql<string>`string_agg(${products.name}, ', ')`,
        products: sql`json_agg(json_build_object('id', ${products.id}, 'name', ${products.name}, 'price', ${products.price}))`,
        createdAt: sql<string>`to_char(${orders.createdAt},'Month ddth, yyyy')`,
        updatedAt: sql<string>`to_char(${orders.updatedAt},'Month ddth, yyyy')`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(stores, eq(orders.storeId, stores.id))
      .where(
        sql`${orders.storeId} = ${storeId} AND ${stores.userId} = ${userId}`
      )
      .groupBy(orders.id),
  ]);

  if (!store) return notFound();
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={queriedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
