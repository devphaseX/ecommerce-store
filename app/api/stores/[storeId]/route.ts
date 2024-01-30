import { DashboardLayoutParams } from '@/app/(dashboard)/[storeId]/layout';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { settingsFormSchema } from '@/validators/setting-form';
import { auth } from '@clerk/nextjs';
import { eq, sql } from 'drizzle-orm';
import { UNAUTHORIZED, NOT_FOUND, BAD_REQUEST, CONFLICT } from 'http-status';
import { Request, NextResponse } from 'next/server';

interface UpdateStoreParams extends Pick<DashboardLayoutParams, 'storeId'> {}

type UpdateStoreContext = { params: UpdateStoreParams };

export const PATCH = async (req: Request, { params }: UpdateStoreContext) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { storeId } = params;

    if (!storeId) {
      return new NextResponse('Store Id is required', { status: BAD_REQUEST });
    }

    let store = await db.query.stores.findFirst({
      where: sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`,
    });

    if (!store) {
      return new NextResponse('Store not found', { status: NOT_FOUND });
    }

    const { name } = settingsFormSchema.parse(await req.json());
    if (store.name.toLowerCase() === name) {
      return new NextResponse('Store name already updated', {
        status: CONFLICT,
      });
    }

    [store] = await db
      .update(stores)
      .set({ name })
      .where(sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`)
      .returning();

    return NextResponse.json(store);
  } catch (e) {
    console.log('[STORES_PATCH]', e);
    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface DeleteStoreParams extends Pick<DashboardLayoutParams, 'storeId'> {}

type DeleteStoreContext = { params: DeleteStoreParams };

export const DELETE = async (_: Request, { params }: DeleteStoreContext) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { storeId } = params;

    if (!storeId) {
      return new NextResponse('Store Id is required', { status: BAD_REQUEST });
    }

    let store = await db.query.stores.findFirst({
      where: sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`,
    });

    if (!store) {
      return new NextResponse('Store not available', { status: BAD_REQUEST });
    }

    await db
      .delete(stores)
      .where(sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`);

    return NextResponse.json(store);
  } catch (e) {
    console.log('[STORES_DELETE]', e);
    return new NextResponse('Internal server error', { status: 500 });
  }
};
