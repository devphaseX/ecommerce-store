import { NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  ParamWithSizeId,
  ParamWithStoreId,
  categoryIdParamSchema,
  createDynamicPathSchema,
  sizeIdParamSchema,
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
import { DrizzleError, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { categories } from '@/schema/category';
import { sizes } from '@/schema/size';
import { sizeFormSchema } from '@/validators/schema';

const categoryParamsSchema = storeIdParamSchema.and(
  categoryIdParamSchema(true)
);
type CategoryParams = Expand<TypeOf<typeof categoryParamsSchema>>;

const updateSizeSchema = object({
  params: storeIdParamSchema.and(
    createDynamicPathSchema(sizeIdParamSchema, true)
  ),
  body: sizeFormSchema,
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
      params: { storeId, sizeId },
    } = updateSizeSchema.parse({
      params,
      body: await req.json(),
    });

    const [size] = await db
      .select()
      .from(sizes)
      .where(sql`${sizes.id} = ${sizeId} and ${sizes.storeId} = ${storeId}`);

    if (!size) {
      return new NextResponse('Not found', { status: NOT_FOUND });
    }

    const { name, value } = body;

    if (name === size.name && size.value === value) {
      return new NextResponse('Size already updated', { status: CONFLICT });
    }

    const updateSize = await db
      .update(sizes)
      .set({ name, value })
      .where(eq(sizes.id, sizeId));

    return NextResponse.json(updateSize);
  } catch (e) {
    console.log('[UPDATE_SIZE_BY_ID]', e);
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

      return new NextResponse('Failed to update size', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface DeleteSizeProps {
  params: ParamWithStoreId & ParamWithSizeId;
}

export const DELETE = async (_: Request, { params }: DeleteSizeProps) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { sizeId, storeId } = storeIdParamSchema
      .and(createDynamicPathSchema(sizeIdParamSchema, true))
      .parse(params);

    const store = await db.query.stores.findFirst({
      where: sql`${stores.userId} = ${userId} and ${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exit', {
        status: UNPROCESSABLE_ENTITY,
      });
    }
    let size = await db.query.sizes.findFirst({
      where: sql`${sizes.storeId} = ${storeId} and ${sizes.id} = ${sizeId}`,
    });

    if (!size) {
      return new NextResponse('size not exist', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    await db.delete(sizes).where(sql`${sizes.id} = ${sizeId}`);

    return new NextResponse('Size deleted succesfully');
  } catch (e) {
    console.log('[SIZE_DELETE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Size delete failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetSizeByIdProps {
  params: ParamWithStoreId & ParamWithSizeId;
}

export const GET = async (_req: Request, { params }: GetSizeByIdProps) => {
  try {
    const { sizeId, storeId } = storeIdParamSchema
      .and(createDynamicPathSchema(sizeIdParamSchema, true))
      .parse(params);

    const store = await db.query.stores.findFirst({
      where: sql`${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exist', { status: UNAUTHORIZED });
    }

    const [size] = await db
      .select({
        id: sizes.id,
        name: sizes.name,
        value: sizes.value,
        createdAt: sql<string>`to_char(${sizes.createdAt},'Month ddth, yyyy')`,
      })
      .from(sizes)
      .where(sql`${sizes.storeId} = ${storeId} and ${sizes.id} = ${sizeId}`)
      .orderBy(asc(sizes.createdAt));

    if (!size) {
      return new Response('Size not found', { status: NOT_FOUND });
    }

    return NextResponse.json(size);
  } catch (e) {
    console.log('[GET_SIZE_BY_ID]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
