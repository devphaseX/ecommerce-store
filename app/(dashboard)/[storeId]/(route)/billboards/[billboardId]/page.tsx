import { auth } from '@clerk/nextjs';
import { BillBoardParams } from './type';
import { redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { BillBoard, billBoards } from '@/schema/bill-board';
import { BillBoardForm } from './components/billboard-form';
import { string } from 'zod';

interface BillBoardPageContext extends LayoutPageBaseProps {
  params: BillBoardParams;
}

const BillBoardPage = async ({
  params: { billboardId },
}: BillBoardPageContext) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  const billboardIdUuidResult = string().uuid().safeParse(billboardId);

  let billboard: BillBoard | null = null;
  if (billboardIdUuidResult.success) {
    billboard =
      (await db.query.billBoards.findFirst({
        where: sql`${billBoards.id} = ${billboardId}`,
      })) ?? null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillBoardForm initialBillBoard={billboard ?? null} />
      </div>
    </div>
  );
};

export default BillBoardPage;
