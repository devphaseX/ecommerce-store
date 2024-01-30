import { NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  categoryIdParamSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { DrizzleError, eq, sql } from 'drizzle-orm';
import { billBoards } from '@/schema/bill-board';
import { stores } from '@/schema/store';
import { categories } from '@/schema/category';
import { categoryFormSchema } from '@/app/(dashboard)/[storeId]/(route)/categories/[categoryId]/(validators)/category-form-schema';

const categoryParamsSchema = storeIdParamSchema.and(categoryIdParamSchema());
type CategoryParams = Expand<TypeOf<typeof categoryParamsSchema>>;

const updateCategorySchema = object({
  params: categoryParamsSchema,
  body: categoryFormSchema,
});

interface UpdateCategoryProps {
  params: CategoryParams;
}

export const PATCH = async (req: Request, { params }: UpdateCategoryProps) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body,
      params: { storeId, categoryId },
    } = updateCategorySchema.parse({
      params,
      body: await req.json(),
    });

    const [category] = await db
      .select()
      .from(categories)
      .where(
        sql`${categories.id} = ${categoryId} and ${categories.storeId} = ${storeId}`
      );

    if (!category) {
      return new NextResponse('Not found', { status: NOT_FOUND });
    }

    const { billboardId, name } = body;

    const billboard = await db.query.billBoards.findFirst({
      where: sql`${billBoards.id} = ${billboardId}`,
    });

    if (!billboard) {
      return new NextResponse(
        'Cannot create a new category record with an non existing billboard',
        { status: UNPROCESSABLE_ENTITY }
      );
    }
    if (name === category.name && category.billboardId === billboardId) {
      return new NextResponse('Category already updated', { status: CONFLICT });
    }

    const updateCategory = await db
      .update(categories)
      .set({ name, billboardId })
      .where(eq(categories.id, categoryId));

    return NextResponse.json(updateCategory);
  } catch (e) {
    console.log('[CATEGORY_UPDATE]', e);
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

      return new NextResponse('Failed to update category', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface DeleteBillboardProps {
  params: CategoryParams;
}

export const DELETE = async (_: Request, { params }: DeleteBillboardProps) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { categoryId, storeId } = categoryParamsSchema.parse(params);

    const billboard = await db.query.categories.findFirst({
      where: sql`${categories.id} = ${categoryId} and ${categories.storeId} = ${storeId}`,
      with: { ownedStore: true },
    });

    if (!billboard) {
      return new NextResponse('Billboard not found', { status: NOT_FOUND });
    }

    if (billboard.ownedStore?.userId !== userId) {
      return new NextResponse('Invalid billboard delete request', {
        status: UNAUTHORIZED,
      });
    }

    await db.delete(categories).where(sql`${categories.id} = ${categoryId}`);

    return new NextResponse('Category deleted');
  } catch (e) {
    console.log('[CATEGORY_DELETE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Billboard delete failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetBillboardByIdProps {
  params: CategoryParams;
}

export const GET = async (_req: Request, { params }: GetBillboardByIdProps) => {
  try {
    const { categoryId, storeId } = categoryParamsSchema.parse(params);

    const store = await db.query.stores.findFirst({
      where: sql`${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exist', { status: UNAUTHORIZED });
    }

    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        createdAt: sql<string>`to_char(${categories.createdAt},'Month ddth, yyyy')`,
        billboardLabel: sql<string>`${billBoards.label}`,
        billboard: billBoards,
      })
      .from(categories)
      .where(
        sql`${categories.storeId} = ${storeId} and ${categories.id} = ${categoryId}`
      )
      .innerJoin(billBoards, sql`${billBoards.id}=${categories.billboardId}`);

    if (!category) {
      return new Response('Category not found', { status: NOT_FOUND });
    }

    return NextResponse.json(category);
  } catch (e) {
    console.log('[GET_CATERGORY_BY_ID]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
