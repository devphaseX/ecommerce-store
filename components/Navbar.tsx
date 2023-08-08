import { UserButton, auth } from '@clerk/nextjs';
import { MainNav } from '@/components/MainNav';
import { StoreSwitcher } from '@/components/store-switcher';
import { redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { stores } from '../schema';
import { sql } from 'drizzle-orm';

export const Navbar = async () => {
  const { userId } = auth();

  if (!userId) return redirect('/sign-in');

  const userStores = await db
    .select()
    .from(stores)
    .where(sql`${stores.userId} = ${userId}`);

  return (
    <div className="border-b ">
      <div className="flex h-16 items-center px-4">
        <StoreSwitcher ownedStores={userStores} />
        <MainNav className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
};
