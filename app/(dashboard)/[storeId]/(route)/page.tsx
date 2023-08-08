import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { auth } from '@clerk/nextjs';
import { sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { FC } from 'react';

interface DashboardPageProps extends PageBaseProps {
  params: { storeId: string };
}

const DashboardPage: FC<DashboardPageProps> = async ({ params }) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  const { storeId } = params;

  const store = await db.query.stores.findFirst({
    where: sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`,
  });

  if (!store) return redirect('/');
  return <div>Active store name: {store.name}</div>;
};

export default DashboardPage;
