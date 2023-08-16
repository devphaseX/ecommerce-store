import { auth } from '@clerk/nextjs';
import { BillBoardClient } from './components/bill-board-client';
import { notFound, redirect } from 'next/navigation';
import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { db } from '@/config/db/neon/initialize';
import { and, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { billBoards } from '@/schema/bill-board';

interface BillboardsPageContext {
  params: ParamWithStoreId;
}

const BillBoardsPage = async ({
  params: { storeId },
}: BillboardsPageContext) => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const [store, billboards] = await Promise.all([
    db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.userId, userId)),
    }),

    db
      .select({
        id: billBoards.id,
        label: billBoards.label,
        imageUrl: billBoards.imageUrl,
        createdAt: sql<string>`to_char(${billBoards.createdAt},'Month ddth, yyyy')`,
      })
      .from(billBoards)
      .where(eq(billBoards.storeId, storeId))
      .orderBy(asc(billBoards.createdAt)),
  ]);

  if (!store) return notFound();
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillBoardClient data={billboards} />
      </div>
    </div>
  );
};

export default BillBoardsPage;
