import { auth } from '@clerk/nextjs';
import { LayoutProps } from '../../../.next/types/app/(root)/page';
import { redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { eq, sql } from 'drizzle-orm';
import { stores } from '@/schema/store';

interface DashboardLayoutProps extends LayoutProps {
  params: { storeId: string };
}

export default async function DashboardLayout({
  children,
  params: { storeId },
}: DashboardLayoutProps) {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  const store = await db.query.stores.findFirst({
    where: sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`,
  });

  if (!store) return redirect('/');

  return (
    <>
      <div>This will be a Navbar</div>
      {children}
    </>
  );
}
