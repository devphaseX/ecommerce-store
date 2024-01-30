import { Request, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  ParamWithColourId,
  ParamWithSizeId,
  ParamWithStoreId,
  categoryIdParamSchema,
  colourIdParamSchema,
  createDynamicPathSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { DrizzleError, asc, eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { colours, requestColourCreateSchema } from '@/schema/colour';

const categoryParamsSchema = storeIdParamSchema.and(categoryIdParamSchema());
type CategoryParams = Expand<TypeOf<typeof categoryParamsSchema>>;
const requestColourUpdateSchema = requestColourCreateSchema.pick({
  name: true,
  value: true,
});

const currentRouteParams = storeIdParamSchema.and(
  createDynamicPathSchema(colourIdParamSchema, true)
);

const updateColourPayloadSchema = object({
  params: currentRouteParams,
  body: requestColourUpdateSchema,
});

interface UpdateColourProps {
  params: CategoryParams;
}

export const PATCH = async (req: Request, { params }: UpdateColourProps) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body,
      params: { storeId, colourId },
    } = updateColourPayloadSchema.parse({
      params,
      body: await req.json(),
    });

    const [colour] = await db
      .select()
      .from(colours)
      .where(
        sql`${colours.id} = ${colourId} and ${colours.storeId} = ${storeId}`
      );

    if (!colour) {
      return new NextResponse('Not found', { status: NOT_FOUND });
    }

    const { name, value } = body;

    if (name === colour.name && colour.value === value) {
      return new NextResponse('Colour already updated', { status: CONFLICT });
    }

    const updateColour = await db
      .update(colours)
      .set({ name, value })
      .where(eq(colours.id, colourId));

    return NextResponse.json(updateColour);
  } catch (e) {
    console.log('[UPDATE_COLOUR_BY_ID]', e);
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

      return new NextResponse('Failed to update colour', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface DeleteColourProps {
  params: ParamWithStoreId & ParamWithColourId;
}

export const DELETE = async (_: Request, { params }: DeleteColourProps) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { colourId, storeId } = currentRouteParams.parse(params);

    const store = await db.query.stores.findFirst({
      where: sql`${stores.userId} = ${userId} and ${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exit', {
        status: UNPROCESSABLE_ENTITY,
      });
    }
    let colour = await db.query.colours.findFirst({
      where: sql`${colours.storeId} = ${storeId} and ${colours.id} = ${colourId}`,
    });

    if (!colour) {
      return new NextResponse('Colour not exist', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    await db.delete(colours).where(sql`${colours.id} = ${colourId}`);

    return new NextResponse('Colour deleted succesfully');
  } catch (e) {
    console.log('[COLOUR_DELETE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Colour delete failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetSizeByIdProps {
  params: ParamWithStoreId & ParamWithSizeId;
}

export const GET = async (_req: Request, { params }: GetSizeByIdProps) => {
  try {
    const { colourId, storeId } = currentRouteParams.parse(params);
    const store = await db.query.stores.findFirst({
      where: sql`${stores.id} = ${storeId}`,
    });

    if (!store) {
      return new NextResponse('Store not exist', { status: UNAUTHORIZED });
    }

    const [size] = await db
      .select({
        id: colours.id,
        name: colours.name,
        value: colours.value,
        createdAt: sql<string>`to_char(${colours.createdAt},'Month ddth, yyyy')`,
      })
      .from(colours)
      .where(
        sql`${colours.storeId} = ${storeId} and ${colours.id} = ${colourId}`
      )
      .orderBy(asc(colours.createdAt));

    if (!size) {
      return new Response('Size not found', { status: NOT_FOUND });
    }

    return NextResponse.json(size);
  } catch (e) {
    console.log('[GET_COLOUR_BY_ID]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
