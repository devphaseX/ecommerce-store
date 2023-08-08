import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { CONFLICT, UNPROCESSABLE_ENTITY } from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { ZodError } from 'zod';
import { createStoreFormSchema } from '../../../validators/create-store';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenicated', { status: 401 });
    }
    const payload = createStoreFormSchema.parse(await req.json());

    const [prevRegisteredStore] = await db
      .select()
      .from(stores)
      .where(sql`lower(${stores.name}) = ${payload.name.toLowerCase()}`);

    if (prevRegisteredStore) {
      return new NextResponse('Store already exist', { status: CONFLICT });
    }

    const [store] = await db
      .insert(stores)
      .values({ name: payload.name, userId })
      .returning();

    return NextResponse.json(store, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse(error.message, {
        status: UNPROCESSABLE_ENTITY,
      });
    }
    console.log('[STORES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
