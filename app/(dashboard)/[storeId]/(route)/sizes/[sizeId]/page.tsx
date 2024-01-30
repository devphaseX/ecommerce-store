import { auth } from '@clerk/nextjs';
import { BillBoardParams } from './type';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { SizeForm } from './components/size-form';
import {
  DynamicPath,
  createDynamicPathSchema,
  sizeIdParamSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { sizes } from '@/schema/size';

interface SizePageContext {
  params: BillBoardParams;
}

const pageParamSchema = storeIdParamSchema.and(
  createDynamicPathSchema(sizeIdParamSchema)
);

const SizePage = async ({ params }: SizePageContext) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  let size;

  const { sizeId, type, storeId } = pageParamSchema.parse(params);

  if (type === DynamicPath.UUID) {
    size = await db.query.sizes.findFirst({
      where: sql`${sizes.id} = ${sizeId} and ${sizes.storeId} = ${storeId}`,
      with: {
        ownedStore: true,
      },
    });

    if (!size || size.ownedStore.userId !== userId) return notFound();
    delete (size as Partial<Pick<typeof size, 'ownedStore'>>).ownedStore;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SizeForm toUpdateSize={size ?? null} />
      </div>
    </div>
  );
};

export default SizePage;
