import { billBoardFormSchema } from '@/app/(dashboard)/[storeId]/(route)/billboards/[billboardId]/(validators)/bill-form-schema';
import { Request, NextResponse } from 'next/server';
import { TypeOf, ZodError, object, string } from 'zod';
import {
  billboardIdParamSchema,
  storeIdParamSchema,
} from '../../(params)/params-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { DrizzleError, asc, eq, sql } from 'drizzle-orm';
import { billBoards } from '@/schema/bill-board';

export const createBillboardSchema = object({
  params: storeIdParamSchema,
  body: billBoardFormSchema,
});

type CreateBillBoardParams = Expand<
  TypeOf<typeof createBillboardSchema>['params']
>;

interface CreateStoreContext {
  params: CreateBillBoardParams;
}

export const POST = async (req: Request, { params }: CreateStoreContext) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body: { imageUrl, label },
      params: { storeId },
    } = createBillboardSchema.parse({
      params,
      body: await req.json(),
    });

    const [store] = await db
      .select()
      .from(stores)
      .where(sql`${stores.id} = ${storeId}`);

    const storeOwnedByAuthUser = store?.userId === userId;
    if (!store) {
      return new NextResponse('Store not found', { status: NOT_FOUND });
    }

    if (!storeOwnedByAuthUser) {
      return new NextResponse('Unauthorized', { status: UNAUTHORIZED });
    }

    const [billboard] = await db
      .insert(billBoards)
      .values({ imageUrl, label, storeId })
      .returning();

    return NextResponse.json(billboard);
  } catch (e) {
    console.log('[BILLBOARD_POST]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Billboard create failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

export const GET = async (_req: Request, { params }: CreateStoreContext) => {
  try {
    const {
      params: { storeId },
    } = createBillboardSchema.pick({ params: true }).parse({ params });

    const [store] = await db
      .select()
      .from(stores)
      .where(sql`${stores.id} = ${storeId}`);

    if (!store) {
      return new NextResponse('Store not exit', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    const billboards = await db
      .select({
        id: billBoards.id,
        label: billBoards.label,
        imageUrl: billBoards.imageUrl,
        createdAt: sql<string>`to_char(${billBoards.createdAt},'Month ddth, yyyy')`,
      })
      .from(billBoards)
      .where(eq(billBoards.storeId, storeId))
      .orderBy(asc(billBoards.createdAt));

    return NextResponse.json(billboards);
  } catch (e) {
    console.log('[BILLBOARD_GET]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
