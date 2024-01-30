import { auth } from '@clerk/nextjs';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { CategoryForm } from './components/category-form';
import {
  CategoryPageParams,
  categoryPageParamsValidator,
} from './(validators)/param-schema';
import { DynamicPath } from '@/app/api/(params)/params-schema';
import { stores } from '@/schema/store';
import { Category, categories } from '@/schema/category';
import { billBoards } from '@/schema/bill-board';

interface CategoryPageContext {
  params: CategoryPageParams;
}

export const dynamic = 'force-dynamic';

const CategoryPage = async ({ params }: CategoryPageContext) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  let paramResult!: CategoryPageParams;
  {
    const _paramsResult = categoryPageParamsValidator.safeParse(params);
    if (!_paramsResult.success) return notFound();
    paramResult = _paramsResult.data;
  }

  const { storeId, type, categoryId } = paramResult;

  const store = await db.query.stores.findFirst({
    where: sql`${stores.id} = ${storeId}`,
  });

  if (!store) return notFound();

  let category: Category | null | undefined;
  let queriedBillboards = await db.query.billBoards.findMany({
    where: sql`${billBoards.storeId} = ${params.storeId}`,
  });

  if (type === DynamicPath.UUID) {
    category = await db.query.categories.findFirst({
      where: sql`${categories.id} = ${categoryId} and ${storeId} = ${storeId}`,
    });

    if (!category) return notFound();
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm
          initialCategory={category ?? null}
          activeBillboards={queriedBillboards}
        />
      </div>
    </div>
  );
};

export default CategoryPage;
