import { Request, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  ParamWithStoreId,
  storeIdParamSchema,
} from '../../(params)/params-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  CONFLICT,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { DrizzleError, asc, eq, sql } from 'drizzle-orm';
import { colours, requestColourCreateSchema } from '@/schema/colour';
import { ColourColumns } from '@/app/(dashboard)/[storeId]/(route)/colours/components/column';

export const createColourSchema = object({
  params: storeIdParamSchema,
  body: requestColourCreateSchema,
});

type CreateColourParams = Expand<TypeOf<typeof createColourSchema>['params']>;

interface CreateColourProps {
  params: CreateColourParams;
}

export const POST = async (req: Request, { params }: CreateColourProps) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body: { name, value },
      params: { storeId },
    } = createColourSchema.parse({
      params,
      body: await req.json(),
    });

    const [store] = await db
      .select()
      .from(stores)
      .where(sql`${stores.id} = ${storeId}`);

    if (!store) {
      return new NextResponse(
        'Cannot create a new size record with an non existing store',
        { status: UNPROCESSABLE_ENTITY }
      );
    }

    const storeOwnedByAuthUser = store?.userId === userId;
    if (!storeOwnedByAuthUser) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    const colour = await db
      .insert(colours)
      .values({ name, value, storeId })
      .returning();

    return NextResponse.json(colour);
  } catch (e) {
    console.log('[POST COLOUR]', JSON.stringify(e));
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      if (e.message.match(/duplicate/i)) {
        return new NextResponse('Colour already exist', { status: CONFLICT });
      }

      return new NextResponse('Failed to create colour', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetColourByIdProps {
  params: ParamWithStoreId;
}

export const GET = async (_req: Request, { params }: GetColourByIdProps) => {
  try {
    const { storeId } = storeIdParamSchema.parse(params);

    const queriedColours = await db
      .select({
        id: colours.id,
        name: colours.name,
        value: colours.value,
        createdAt: sql<string>`to_char(${colours.createdAt},'Month ddth, yyyy')`,
      } satisfies Record<keyof ColourColumns, unknown>)
      .from(colours)
      .where(eq(colours.storeId, storeId))
      .orderBy(asc(colours.createdAt));

    return NextResponse.json(queriedColours);
  } catch (e) {
    console.log('[GET_COLOUR]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
