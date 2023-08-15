import { NextRequest, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import { storeIdParamSchema } from '../../(params)/params-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { DrizzleError, sql } from 'drizzle-orm';
import { billBoards } from '@/schema/bill-board';
import { categoryFormSchema } from '@/app/(dashboard)/[storeId]/(route)/categories/[categoryId]/(validators)/category-form-schema';
import { categories } from '@/schema/category';

export const createBillboardSchema = object({
  params: storeIdParamSchema,
  body: categoryFormSchema,
});

type CreateCategoryParams = Expand<
  TypeOf<typeof createBillboardSchema>['params']
>;

interface CreateCategoryContext {
  params: CreateCategoryParams;
}

export const POST = async (
  req: NextRequest,
  { params }: CreateCategoryContext
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body: { billboardId, name },
      params: { storeId },
    } = createBillboardSchema.parse({
      params,
      body: await req.json(),
    });

    const [[store], billboard] = await Promise.all([
      db
        .select()
        .from(stores)
        .where(sql`${stores.id} = ${storeId}`),
      db.query.billBoards.findFirst({
        where: sql`${billBoards.id} = ${billboardId} and ${billBoards.storeId} = ${storeId}`,
      }),
    ]);

    const storeOwnedByAuthUser = store && store?.userId === userId;

    if (!storeOwnedByAuthUser) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    if (!billboard) {
      return new NextResponse(
        'Cannot create a new category record with an invalid billboard',
        { status: UNPROCESSABLE_ENTITY }
      );
    }

    const category = await db
      .insert(categories)
      .values({ name, billboardId, storeId })
      .returning();

    return NextResponse.json(category);
  } catch (e) {
    console.log('[CATEGORY_POST]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      if (e.message.match(/duplicate/i)) {
        return new NextResponse('Category already exist', { status: CONFLICT });
      }

      return new NextResponse('Failed to create category', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

export const GET = async (
  _req: NextRequest,
  { params }: CreateCategoryContext
) => {
  try {
    const {
      params: { storeId },
    } = createBillboardSchema.pick({ params: true }).parse({ params });

    const queriedCategories = await db.query.categories.findMany({
      where: sql`${categories.storeId} = ${storeId}`,
    });

    return NextResponse.json(queriedCategories);
  } catch (e) {
    console.log('[CATEGORY_GET]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
