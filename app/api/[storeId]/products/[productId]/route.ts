import { NextRequest, NextResponse } from 'next/server';
import { ZodError, object } from 'zod';
import {
  ParamWithColourId,
  ParamWithProductId,
  ParamWithStoreId,
  createDynamicPathSchema,
  productIdParamSchema,
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
import { DrizzleError, asc, eq, sql, and } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { colours } from '@/schema/colour';
import {
  CreateProduct,
  ResponseProduct,
  createProductSchema,
  products,
} from '@/schema/product';
import { categories } from '@/schema/category';
import { sizes } from '@/schema/size';
import { classifyImageServer } from '@/lib/utils';
import { images } from '@/schema/image';

const currentRouteParams = storeIdParamSchema.and(
  createDynamicPathSchema(productIdParamSchema, true)
);

const updateProductPayloadSchema = object({
  params: currentRouteParams,
  body: createProductSchema,
});

interface UpdateColourContext {
  params: ParamWithStoreId & ParamWithProductId;
}

export const PATCH = async (
  req: NextRequest,
  { params }: UpdateColourContext
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body,
      params: { storeId, productId },
    } = updateProductPayloadSchema.parse({
      params,
      body: await req.json(),
    });

    let [retrievedProduct] = await db.query.products.findMany({
      where: sql`${products.id} = ${productId} and ${products.storeId} = ${storeId}`,
      with: { images: true },
    });

    if (!retrievedProduct) {
      return new NextResponse('Not found', { status: NOT_FOUND });
    }

    type CreateProductWithOptionalImage = Omit<CreateProduct, 'images'> &
      Partial<Pick<CreateProduct, 'images'>>;

    let updatedProduct = await db.transaction(async (tx) => {
      const _images = body.images;
      delete (<CreateProductWithOptionalImage>body).images;

      await tx
        .insert(products)
        .values({ ...body, storeId })
        .returning();

      const { newlyAddedImage, removeServerImage } = classifyImageServer({
        serverSavedImages: retrievedProduct.images,
        clientSentImages: _images,
      });

      await Promise.all([
        removeServerImage.map(({ id }) =>
          tx
            .delete(images)
            .where(
              sql`${images.id} = ${id} and ${images.productId} = ${retrievedProduct.id}`
            )
        ),
      ]);

      await tx.insert(images).values(
        newlyAddedImage.map(({ url }) => ({
          productId: retrievedProduct.id,
          url,
        }))
      );

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

    return NextResponse.json(updatedProduct);
  } catch (e) {
    console.log('[UPDATE_PRODUCT_BY_ID]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      if (e.message.match(/duplicate/i)) {
        return new NextResponse('Colour already exist', { status: CONFLICT });
      }

      return new NextResponse('Failed to update colour', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface DeleteColourContext {
  params: ParamWithStoreId & ParamWithColourId;
}

export const DELETE = async (
  _: NextRequest,
  { params }: DeleteColourContext
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { productId, storeId } = currentRouteParams.parse(params);

    const store = await db.query.stores.findFirst({
      where: sql`${stores.userId} = ${userId} and ${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exit', {
        status: UNPROCESSABLE_ENTITY,
      });
    }
    let colour = await db.query.products.findFirst({
      where: sql`${products.storeId} = ${storeId} and ${products.id} = ${productId}`,
    });

    if (!colour) {
      return new NextResponse('Product not exist', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    await db.delete(products).where(sql`${products.id} = ${products}`);

    return new NextResponse('Product deleted succesfully');
  } catch (e) {
    console.log('[PRODUCT_DELETE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Product delete failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetProductByIdContext {
  params: ParamWithStoreId & ParamWithProductId;
}

export const GET = async (
  _req: NextRequest,
  { params }: GetProductByIdContext
) => {
  try {
    const { productId, storeId } = currentRouteParams.parse(params);
    const store = await db.query.stores.findFirst({
      where: sql`${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exist', { status: UNAUTHORIZED });
    }

    const [product] = await db
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
      .where(and(eq(products.storeId, storeId), eq(products.id, productId)))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(colours, eq(products.colourId, colours.id))
      .innerJoin(sizes, eq(products.sizeId, sizes.id))
      .orderBy(asc(products.createdAt));

    if (!product) {
      return new Response('Product not found', { status: NOT_FOUND });
    }

    return NextResponse.json(product);
  } catch (e) {
    console.log('[GET_PRODUCT_BY_ID]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
