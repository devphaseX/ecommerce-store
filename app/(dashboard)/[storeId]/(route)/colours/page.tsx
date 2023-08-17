import { auth } from '@clerk/nextjs';
import { ColourClient } from './components/colour-board-client';
import { notFound, redirect } from 'next/navigation';
import { ParamWithStoreId } from '@/app/api/(params)/params-schema';
import { db } from '@/config/db/neon/initialize';
import { and, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { sizes } from '@/schema/size';
import { ColourColumns } from './components/column';
import { colours } from '@/schema/colour';

interface ColourPageContext {
  params: ParamWithStoreId;
}

const ColourPage = async ({ params: { storeId } }: ColourPageContext) => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const [store, queiredColours] = await Promise.all([
    db.query.stores.findFirst({
      where: and(eq(stores.id, storeId), eq(stores.userId, userId)),
    }),
    db
      .select({
        id: colours.id,
        name: colours.name,
        value: colours.value,
        createdAt: sql<string>`to_char(${colours.createdAt},'Month ddth, yyyy')`,
      } satisfies Record<keyof ColourColumns, unknown>)
      .from(colours)
      .where(eq(colours.storeId, storeId))
      .orderBy(asc(colours.createdAt)),
  ]);

  if (!store) return notFound();
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ColourClient data={queiredColours} />
      </div>
    </div>
  );
};

export default ColourPage;
