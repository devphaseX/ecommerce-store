import { NextRequest, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  ParamWithCategoryId,
  ParamWithColourId,
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
import { DrizzleError, and, asc, eq, not, sql } from 'drizzle-orm';
import { colours } from '@/schema/colour';
import {
  CreateProduct,
  ResponseProduct,
  createProductSchema,
  products,
} from '@/schema/product';
import { categories } from '@/schema/category';
import { sizes } from '@/schema/size';
import { Image, images } from '@/schema/image';

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
    } satisfies TypeOf<typeof createProductSchema>);

    type CreateProductWithOptionalImage = Omit<CreateProduct, 'images'> &
      Partial<Pick<CreateProduct, 'images'>>;

    const _images = data.images;
    delete (<CreateProductWithOptionalImage>data).images;

    let [newProduct] = await db
      .insert(products)
      .values({ ...data, storeId })
      .returning();

    await Promise.all([
      db
        .insert(images)
        .values(_images.map(({ url }) => ({ productId: newProduct.id, url }))),
    ]);

    [newProduct] = <[typeof newProduct]>(<unknown>await db
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
      .orderBy(asc(products.createdAt)));

    return NextResponse.json(newProduct);
  } catch (e) {
    console.log('[POST PRODUCT]', e);
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

interface GetProductSearchParams
  extends Partial<ParamWithCategoryId>,
    Partial<ParamWithSizeId>,
    Partial<ParamWithColourId> {
  isFeatured?: boolean;
  isArchieved?: boolean;
  productSuggestedId?: string;
}
interface GetProductContext {
  params: ParamWithStoreId;
  searchParams: GetProductSearchParams;
}

export const GET = async (req: NextRequest, { params }: GetProductContext) => {
  try {
    const { storeId } = storeIdParamSchema.parse(params);

    const query: GetProductSearchParams = Object.fromEntries(
      new URL(req.url).searchParams
    );

    const {
      categoryId,
      sizeId,
      colourId,
      isArchieved,
      isFeatured,
      productSuggestedId,
    } = query;

    type ProductEqType = ReturnType<typeof eq<typeof products.storeId>>;

    const dbFilteredQuery = Object.values({
      categoryId: categoryId ? eq(products.categoryId, categoryId) : null,
      sizeId: sizeId ? eq(products.sizeId, sizeId) : null,
      colourId: colourId ? eq(products.colourId, colourId) : null,
      isArchieved:
        typeof isArchieved !== 'undefined'
          ? eq(products.isArchieved, isArchieved)
          : eq(products.isArchieved, false),
      isFeatured:
        typeof isFeatured !== 'undefined'
          ? eq(products.isFeatured, isFeatured)
          : null,

      productSuggestedId:
        typeof productSuggestedId !== 'undefined'
          ? not(eq(products.id, productSuggestedId))
          : null,
    }).filter((value): value is ProductEqType => !!value);

    const queriedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        categoryId: products.categoryId,
        category: categories.name,
        colourId: products.colourId,
        colour: colours.value,
        colourName: colours.name,
        sizeId: products.sizeId,
        size: sizes.name,
        isArchieved: products.isArchieved,
        isFeatured: products.isFeatured,
        updatedAt: sql<string>`to_char(${products.createdAt},'Month ddth, yyyy')`,
        createdAt: sql<string>`to_char(${products.createdAt},'Month ddth, yyyy')`,
        images: sql<Array<Pick<Image, 'id' | 'url'>>>`json_agg(
          json_build_object('id', ${images.id}, 'url', ${images.url}))`,
      } satisfies Record<keyof ResponseProduct & { categeoryId: string; colourId: string }, unknown>)
      .from(products)
      .where(
        dbFilteredQuery.length
          ? and(eq(products.storeId, storeId), ...dbFilteredQuery)
          : eq(products.storeId, storeId)
      )
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(colours, eq(products.colourId, colours.id))
      .innerJoin(sizes, eq(products.sizeId, sizes.id))
      .innerJoin(images, eq(products.id, images.productId))
      .groupBy(
        products.id,
        categories.name,
        colours.value,
        colours.name,
        sizes.name
      )
      .orderBy(asc(products.createdAt));

    console.log({ queriedProducts });
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
