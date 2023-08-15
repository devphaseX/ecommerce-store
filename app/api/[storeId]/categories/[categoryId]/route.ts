import { NextRequest, NextResponse } from 'next/server';
import { TypeOf, ZodError, object } from 'zod';
import {
  billboardIdParamSchema,
  storeIdParamSchema,
} from '@/app/api/(params)/params-schema';
import { billBoardFormSchema } from '@/app/(dashboard)/[storeId]/(route)/billboards/[billboardId]/(validators)/bill-form-schema';
import { auth } from '@clerk/nextjs';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from 'http-status';
import { db } from '@/config/db/neon/initialize';
import { DrizzleError, and, eq, sql } from 'drizzle-orm';
import { billBoards } from '@/schema/bill-board';
import { stores } from '@/schema/store';

const billboardParamsSchema = storeIdParamSchema.and(billboardIdParamSchema);
type BillBoardRequestParams = Expand<TypeOf<typeof billboardParamsSchema>>;

const updateBillboardSchema = object({
  params: billboardParamsSchema,
  body: billBoardFormSchema,
});

interface UpdateBillboardContext {
  params: BillBoardRequestParams;
}

export const PATCH = async (
  req: NextRequest,
  { params }: UpdateBillboardContext
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const {
      body,
      params: { storeId, billboardId },
    } = updateBillboardSchema.parse({
      params,
      body: await req.json(),
    });

    const [billboard] = await db
      .select()
      .from(billBoards)
      .where(
        sql`${billBoards.id} = ${billboardId} and ${billBoards.storeId} = ${storeId}`
      );

    if (!billboard) {
      return new NextResponse('Not found', { status: NOT_FOUND });
    }

    await db
      .update(billBoards)
      .set(body)
      .where(eq(billBoards.id, billboard.id));

    return NextResponse.json(billboard);
  } catch (e) {
    console.log('[BILLBOARD_UPDATE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Billboard update failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface DeleteBillboardContext {
  params: BillBoardRequestParams;
}

export const DELETE = async (
  _: NextRequest,
  { params }: DeleteBillboardContext
) => {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthenciated', { status: UNAUTHORIZED });
    }

    const { billboardId, storeId } = billboardParamsSchema.parse(params);

    const billboard = await db.query.billBoards.findFirst({
      where: sql`${billBoards.id} = ${billboardId} and ${billBoards.storeId} = ${storeId}`,
      with: { store: true },
    });

    if (!billboard) {
      return new NextResponse('Billboard not found', { status: NOT_FOUND });
    }

    if (billboard.store.userId !== userId) {
      return new NextResponse('Invalid billboard delete request', {
        status: CONFLICT,
      });
    }

    await db.delete(billBoards).where(sql`${billBoards.id} = ${billboard.id}`);

    return new NextResponse('Billboard deleted');
  } catch (e) {
    console.log('[BILLBOARD_DELETE]', e);
    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));

      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
      return new NextResponse(e.message, { status: UNPROCESSABLE_ENTITY });
    }

    if (e instanceof DrizzleError) {
      return new NextResponse('Billboard delete failed', {
        status: UNPROCESSABLE_ENTITY,
      });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};

interface GetBillboardByIdContext {
  params: BillBoardRequestParams;
}

export const GET = async (
  _req: NextRequest,
  { params }: GetBillboardByIdContext
) => {
  try {
    const { billboardId, storeId } = billboardParamsSchema.parse(params);

    const [billboard] = await db
      .select()
      .from(billBoards)
      .where(
        and(eq(billBoards.storeId, storeId), eq(billBoards.id, billboardId))
      )
      .innerJoin(stores, eq(stores.id, storeId));

    if (!billboard) {
      return new Response('Billboard not found', { status: NOT_FOUND });
    }

    return NextResponse.json(billboard);
  } catch (e) {
    console.log('[GET_BILLBOARD_BY_ID]', e);

    if (e instanceof ZodError) {
      const pathIssue = e.issues.find(({ path }) => path.includes('query'));
      if (pathIssue) {
        return new NextResponse(pathIssue.message, { status: BAD_REQUEST });
      }
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
};
