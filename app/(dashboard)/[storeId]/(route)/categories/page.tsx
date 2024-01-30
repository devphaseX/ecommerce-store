import { auth } from '@clerk/nextjs';
import { CategoriesClient } from './components/category-board-client';
import { notFound, redirect } from 'next/navigation';
import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { db } from '@/config/db/neon/initialize';
import { and, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { categories } from '@/schema/category';
import { billBoardRelations, billBoards } from '@/schema/bill-board';

interface BillboardsPageContext {
  params: ParamWithStoreId;
}
export const dynamic = 'force-dynamic';

const CategoriesPage = async ({
  params: { storeId },
}: BillboardsPageContext) => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const [store, queriedCategories] = await Promise.all([
    db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.userId, userId)),
    }),

    db
      .select({
        id: categories.id,
        name: categories.name,
        createdAt: sql<string>`to_char(${categories.createdAt},'Month ddth, yyyy')`,
        billboardLabel: sql<string>`${billBoards.label}`,
      })
      .from(categories)
      .where(sql`${categories.storeId} = ${storeId}`)
      .orderBy(asc(categories.createdAt))
      .innerJoin(billBoards, sql`${billBoards.id}=${categories.billboardId}`),
  ]);

  if (!store) return notFound();
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoriesClient data={queriedCategories} />
      </div>
    </div>
  );
};

export default CategoriesPage;
