import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';
import { db } from '@/config/db/neon/initialize';
import { parsedEnv } from '@/config/env';
import { BAD_REQUEST } from 'http-status';
import { orders } from '@/schema/order';
import { eq, inArray } from 'drizzle-orm';
import { orderItems } from '@/schema/orderItem';
import { products } from '@/schema/product';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = <string>headers().get('Stripe-Signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      parsedEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.log(e);
    return new NextResponse(
      `Webhook Error: ${(<{ message: string }>e).message}`,
      { status: BAD_REQUEST }
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const addressInfos = session.customer_details?.address;
  const addressComponents = [
    addressInfos?.line1,
    addressInfos?.line2,
    addressInfos?.city,
    addressInfos?.state,
    addressInfos?.postal_code,
    addressInfos?.country,
  ];

  const address = addressComponents.join(', ');
  if (
    event.type === 'checkout.session.completed' &&
    session?.metadata?.orderId
  ) {
    const orderId = session.metadata.orderId;

    await db
      .update(orders)
      .set({
        madePayment: true,
        address,
        phoneNo: session?.customer_details?.phone || '',
      })
      .where(eq(orders.id, orderId));

    const productIds = await db.query.orderItems
      .findMany({
        where: eq(orderItems.orderId, orderId),
      })
      .then((orders) => orders.map((order) => order.productId));

    await db
      .update(products)
      .set({ isArchieved: true })
      .where(inArray(products.id, productIds));
  }

  return new NextResponse(null, { status: 200 });
}
