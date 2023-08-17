import { NextRequest, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
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
import { DrizzleError, asc, eq, sql } from 'drizzle-orm';
import { colours } from '@/schema/colour';
import {
  CreateProduct,
  ResponseProduct,
  createProductSchema,
  products,
} from '@/schema/product';
import { categories } from '@/schema/category';
import { sizes } from '@/schema/size';
import { images } from '@/schema/image';

export const createProductRouteSchema = object({
  params: storeIdParamSchema,
  body: createProductSchema,
});

type CreateProductParam = Expand<
  NonNullable<TypeOf<typeof createProductRouteSchema>['params']>
>;

interface CreateProductContext {
  params: CreateProductParam;
}

export const POST = async (
  req: NextRequest,
  { params }: CreateProductContext
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body,
      params: { storeId },
    } = createProductRouteSchema.parse({
      params,
      body: await req.json(),
    });

    const [store] = await db
      .select()
      .from(stores)
      .where(sql`${stores.id} = ${storeId}`);

    if (!store) {
      return new NextResponse(
        'Cannot create a new product record with an non existing store',
        { status: UNPROCESSABLE_ENTITY }
      );
    }

    const storeOwnedByAuthUser = store?.userId === userId;
    if (!storeOwnedByAuthUser) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    const data = createProductSchema.parse({
      ...body,
      storeId: store.id,
    } satisfies TypeOf<typeof createProductSchema>);

    type CreateProductWithOptionalImage = Omit<CreateProduct, 'images'> &
      Partial<Pick<CreateProduct, 'images'>>;

    const product = await db.transaction(async (tx) => {
      const _images = data.images;
      delete (<CreateProductWithOptionalImage>data).images;

      const [newProduct] = await tx
        .insert(products)
        .values({ ...data, storeId })
        .returning();

      await Promise.all([
        tx
          .insert(images)
          .values(
            _images.map(({ url }) => ({ productId: newProduct.id, url }))
          ),
      ]);

      return await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          category: categories.name,
          colour: colours.value,
          size: sizes.name,
          isArchieved: products.isArchieved,
          isFeatured: products.isFeatured,
          updatedAt: sql<string>`to_char(${products.createdAt},'Month ddth, yyyy')`,
          createdAt: sql<string>`to_char(${products.createdAt},'Month ddth, yyyy')`,
        } satisfies Record<keyof ResponseProduct, unknown>)
        .from(products)
        .where(eq(products.storeId, storeId))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .innerJoin(colours, eq(products.colourId, colours.id))
        .innerJoin(sizes, eq(products.sizeId, sizes.id))
        .orderBy(asc(products.createdAt));
    });

    return NextResponse.json(product);
  } catch (e) {
    console.log('[POST PRODUCT]', JSON.stringify(e));
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      if (e.message.match(/duplicate/i)) {
        return new NextResponse('Product already exist', { status: CONFLICT });
      }

      return new NextResponse('Failed to create product', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetProductContext {
  params: ParamWithStoreId;
}

export const GET = async (_req: NextRequest, { params }: GetProductContext) => {
  try {
    const { storeId } = storeIdParamSchema.parse(params);

    const queriedProducts: ResponseProduct[] = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        category: categories.name,
        colour: colours.value,
        size: sizes.name,
        isArchieved: products.isArchieved,
        isFeatured: products.isFeatured,
        updatedAt: sql<string>`to_char(${products.createdAt},'Month ddth, yyyy')`,
        createdAt: sql<string>`to_char(${products.createdAt},'Month ddth, yyyy')`,
      } satisfies Record<keyof ResponseProduct, unknown>)
      .from(products)
      .where(eq(products.storeId, storeId))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(colours, eq(products.colourId, colours.id))
      .innerJoin(sizes, eq(products.sizeId, sizes.id))
      .orderBy(asc(products.createdAt));

    return NextResponse.json(queriedProducts);
  } catch (e) {
    console.log('[GET_PRODUCTS]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
