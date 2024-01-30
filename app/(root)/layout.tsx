import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { eq } from 'drizzle-orm';
import { stores } from '@/schema/store';

interface SetupLayoutProps {
  children: React.ReactNode;
}

export default async function SetupLayout({ children }: SetupLayoutProps) {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const store = await db.query.stores.findFirst({
    where: eq(stores.userId, userId),
  });

  if (store) return redirect(`${store.id}`);

  return <>{children}</>;
}
