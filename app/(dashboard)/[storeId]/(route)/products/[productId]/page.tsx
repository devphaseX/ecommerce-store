import { auth } from '@clerk/nextjs';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { ProductForm } from './components/product-form';
import {
  DynamicPath,
  ParamWithColourId,
  ParamWithStoreId,
  createDynamicPathSchema,
  productIdParamSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { colours } from '@/schema/colour';
import { products } from '@/schema/product';
import { categories } from '@/schema/category';
import { sizes } from '@/schema/size';

interface ProductPageContext extends LayoutPageBaseProps {
  params: ParamWithStoreId & ParamWithColourId;
}

const pageParamSchema = storeIdParamSchema.and(
  createDynamicPathSchema(productIdParamSchema)
);

const ProductPage = async ({ params }: ProductPageContext) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  const { productId, type, storeId } = pageParamSchema.parse(params);
  const [queriedCategories, queriedSizes, queriedColours] = await Promise.all([
    db.query.categories.findMany({
      where: sql`${categories.storeId} = ${storeId}`,
    }),
    db.query.sizes.findMany({ where: sql`${sizes.storeId} = ${storeId}` }),
    db.query.colours.findMany({
      where: sql`${colours.storeId} = ${storeId}`,
    }),
  ]);

  let product;
  if (type === DynamicPath.UUID) {
    product = await db.query.products.findFirst({
      where: sql`${products.id} = ${productId} and ${products.storeId} = ${storeId}`,
      with: {
        store: true,
        category: true,
        colour: true,
        images: true,
        size: true,
      },
    });

    if (!product || product.store.userId !== userId) return notFound();
    delete (product as Partial<Pick<typeof product, 'store'>>).store;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm
          toUpdateProduct={(product as any) ?? null}
          categories={queriedCategories}
          sizes={queriedSizes}
          colours={queriedColours}
        />
      </div>
    </div>
  );
};

export default ProductPage;
