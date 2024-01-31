import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import {
  ParamWithStoreId,
  storeIdParamSchema,
} from '../../../(params)/params-schema';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { eq, inArray, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { ZodError, array, object, string } from 'zod';
import { products } from '@/schema/product';
import Stripe from 'stripe';
import { orders } from '@/schema/order';
import { orderItems } from '@/schema/orderItem';
import { parsedEnv } from '@/config/env';

const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers':
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
};

export const OPTIONS = () => {
  return NextResponse.json({}, { headers: new Headers(corsHeaders) });
};

export const POST = async (
  req: Request,
  { params }: { params: ParamWithStoreId }
) => {
  try {
    !storeIdParamSchema.parse(params);

    const {
      productIds,
      callbackUrls: { confirmationUrl, cancellationUrl },
    } = object({
      productIds: array(string()),
      callbackUrls: object({
        confirmationUrl: string().url(),
        cancellationUrl: string().url(),
      }),
    }).parse(await req.json());

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, params.storeId),
    });

    if (!store) {
      return new NextResponse('Store not exist', { status: NOT_FOUND });
    }

    const queriedProducts = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    });

    if (queriedProducts.length !== productIds.length) {
      const missingProducts = productIds.filter(
        (productId) =>
          !queriedProducts.find((product) => product.id === productId)
      );

      return new NextResponse(
        `${
          missingProducts.length === 1 ? 'This' : 'These'
        } ${missingProducts.join(', ')} of the cart products ${
          missingProducts.length === 1 ? 'is' : 'are'
        } not available`,
        {
          status: CONFLICT,
        }
      );
    }

    // duplicate order
    {
      const queriedOrders = await db.query.orders.findMany({
        where: eq(orders.storeId, params.storeId),
        with: {
          orderItems: { where: inArray(orderItems.productId, productIds) },
        },

        orderBy: sql`${orders.createdAt} desc`,
      });

      if (
        queriedOrders.find(
          (order) =>
            (order.orderItems.every((item) =>
              productIds.find((pId) => item.productId === pId)
            ) &&
              !order.createdAt) ||
            Date.now() - order.createdAt!.getTime() < 2 * 60 * 1000
        )
      ) {
        return new NextResponse('Possible duplicate order', {
          status: UNPROCESSABLE_ENTITY,
        });
      }
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      queriedProducts.map((product) => ({
        quantity: 1,
        price_data: {
          currency: 'USD',
          product_data: { name: product.name },
          unit_amount: Number(product.price) * 100,
        },
      }));

    const [order] = await db
      .insert(orders)
      .values({ storeId: params.storeId, madePayment: false })
      .returning();

    await db.insert(orderItems).values(
      queriedProducts.map((product) => ({
        orderId: order.id,
        productId: product.id,
      }))
    );

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      success_url: confirmationUrl,
      cancel_url: cancellationUrl,
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json(
      { url: session.url },
      { headers: new Headers(corsHeaders) }
    );
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError) {
      if (
        e.issues.find(({ path }) => path.find((seg) => seg === 'productIds'))
      ) {
        return new NextResponse('Invalid product Ids', {
          status: UNPROCESSABLE_ENTITY,
          headers: new Headers(corsHeaders),
        });
      }

      if (e.issues.find(({ path }) => path.find((seg) => seg === 'storeId')))
        return new NextResponse('Invalid store Id type', {
          status: BAD_REQUEST,
          headers: new Headers(corsHeaders),
        });
    }
    return new NextResponse(
      (<{ message: string }>Object(e)).message || <string>e,
      {
        status: BAD_REQUEST,
        headers: new Headers(corsHeaders),
      }
    );
  }
};
