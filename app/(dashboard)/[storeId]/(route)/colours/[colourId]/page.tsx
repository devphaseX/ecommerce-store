import { auth } from '@clerk/nextjs';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { ColourForm } from './components/colour-form';
import {
  DynamicPath,
  ParamWithColourId,
  ParamWithStoreId,
  colourIdParamSchema,
  createDynamicPathSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { colours } from '@/schema/colour';

interface ColourPageContext {
  params: ParamWithStoreId & ParamWithColourId;
}

const pageParamSchema = storeIdParamSchema.and(
  createDynamicPathSchema(colourIdParamSchema)
);

const ColourPage = async ({ params }: ColourPageContext) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  let colour;

  const { colourId, type, storeId } = pageParamSchema.parse(params);

  if (type === DynamicPath.UUID) {
    colour = await db.query.colours.findFirst({
      where: sql`${colours.id} = ${colourId} and ${colours.storeId} = ${storeId}`,
      with: {
        ownedStore: true,
      },
    });

    if (!colour || colour.ownedStore.userId !== userId) return notFound();
    delete (colour as Partial<Pick<typeof colour, 'ownedStore'>>).ownedStore;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ColourForm toUpdateColour={colour ?? null} />
      </div>
    </div>
  );
};

export default ColourPage;
