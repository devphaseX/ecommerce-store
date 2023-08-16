import { NextRequest, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  ParamWithSizeId,
  ParamWithStoreId,
  storeIdParamSchema,
} from '../../(params)/params-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  CONFLICT,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { DrizzleError, eq, sql } from 'drizzle-orm';

import { sizes } from '@/schema/size';
import { sizeFormSchema } from '@/app/(dashboard)/[storeId]/(route)/sizes/[sizeId]/(validators)/size-form-schema';
import { SizeColumns } from '@/app/(dashboard)/[storeId]/(route)/sizes/components/column';

export const createSizeSchema = object({
  params: storeIdParamSchema,
  body: sizeFormSchema,
});

type CreateSizeParams = Expand<TypeOf<typeof createSizeSchema>['params']>;

interface CreateSizeContext {
  params: CreateSizeParams;
}

export const POST = async (req: NextRequest, { params }: CreateSizeContext) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body: { name, value },
      params: { storeId },
    } = createSizeSchema.parse({
      params,
      body: await req.json(),
    });

    const [store] = await db
      .select()
      .from(stores)
      .where(sql`${stores.id} = ${storeId}`);

    if (!store) {
      return new NextResponse(
        'Cannot create a new size record with an non existing store',
        { status: UNPROCESSABLE_ENTITY }
      );
    }

    const storeOwnedByAuthUser = store?.userId === userId;
    if (!storeOwnedByAuthUser) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    const size = await db
      .insert(sizes)
      .values({ name, value, storeId })
      .returning();

    return NextResponse.json(size);
  } catch (e) {
    console.log('[POST SIZE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      if (e.message.match(/duplicate/i)) {
        return new NextResponse('Size already exist', { status: CONFLICT });
      }

      return new NextResponse('Failed to create size', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetSizeByIdContext {
  params: ParamWithStoreId & ParamWithSizeId;
}

export const GET = async (
  _req: NextRequest,
  { params }: GetSizeByIdContext
) => {
  try {
    const { storeId } = storeIdParamSchema.parse(params);

    const queriedSizes = await db
      .select({
        id: sizes.id,
        name: sizes.name,
        value: sizes.value,
        createdAt: sql<string>`to_char(${sizes.createdAt},'Month ddth, yyyy')`,
      } satisfies Record<keyof SizeColumns, unknown>)
      .from(sizes)
      .where(eq(sizes.storeId, storeId))
      .orderBy(sizes.createdAt);

    return NextResponse.json(queriedSizes);
  } catch (e) {
    console.log('[GET_SIZES]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
