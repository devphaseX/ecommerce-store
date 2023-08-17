import { auth } from '@clerk/nextjs';
import { ProductClient } from './components/product-board-client';
import { notFound, redirect } from 'next/navigation';
import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { db } from '@/config/db/neon/initialize';
import { and, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { sizes } from '@/schema/size';
import { colours } from '@/schema/colour';
import { ResponseProduct, categories, products } from '@/schema/index';

interface ProductPageContext {
  params: ParamWithStoreId;
  url: string;
}

const ProductPage = async ({ params: { storeId } }: ProductPageContext) => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const [store, queriedProducts] = await Promise.all([
    db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.userId, userId)),
    }),
    db
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
      .orderBy(asc(products.createdAt)),
  ]);

  if (!store) return notFound();
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={queriedProducts} />
      </div>
    </div>
  );
};

export default ProductPage;
