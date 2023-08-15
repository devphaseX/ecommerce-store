import { auth } from '@clerk/nextjs';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { CategoryForm } from './components/category-form';
import { SingleCategoryParam } from './(validators)/param-schema';
import {
  categoryIdParamSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { stores } from '@/schema/store';
import { Category, categories } from '@/schema/category';
import { BillBoard, billBoards } from '@/schema/bill-board';

interface CategoryParams extends SingleCategoryParam {}
interface CategoryPageContext extends LayoutPageBaseProps {
  params: CategoryParams;
}

const CategoryPage = async ({ params }: CategoryPageContext) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  if (!storeIdParamSchema.safeParse(params).success) {
    return notFound();
  }

  const store = await db.query.stores.findFirst({
    where: sql`${stores.id} = ${params.storeId}`,
  });

  if (!store) return notFound();

  const triggerCategoryUpdate = categoryIdParamSchema.safeParse(params).success;

  let category: Category | null | undefined;
  let queriedBillboards = await db.query.billBoards.findMany({
    where: sql`${billBoards.storeId} = ${params.storeId}`,
  });
  if (triggerCategoryUpdate) {
    category = await db.query.categories.findFirst({
      where: sql`${categories.id} = ${params.categoryId} and ${categories.storeId} = ${params.storeId}`,
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
