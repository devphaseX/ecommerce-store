import { auth } from '@clerk/nextjs';
import { SizeClient } from './components/size-board-client';
import { notFound, redirect } from 'next/navigation';
import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { db } from '@/config/db/neon/initialize';
import { and, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { sizes } from '@/schema/size';
import { SizeColumns } from './components/column';

interface SizesPageContext {
  params: ParamWithStoreId;
}

const SizesPage = async ({ params: { storeId } }: SizesPageContext) => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const [store, queriedSizes] = await Promise.all([
    db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.userId, userId)),
    }),
    db
      .select({
        id: sizes.id,
        name: sizes.name,
        value: sizes.value,
        createdAt: sql<string>`to_char(${sizes.createdAt},'Month ddth, yyyy')`,
      } satisfies Record<keyof SizeColumns, unknown>)
      .from(sizes)
      .where(eq(sizes.storeId, storeId))
      .orderBy(asc(sizes.createdAt)),
  ]);

  if (!store) return notFound();
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SizeClient data={queriedSizes} />
      </div>
    </div>
  );
};

export default SizesPage;
