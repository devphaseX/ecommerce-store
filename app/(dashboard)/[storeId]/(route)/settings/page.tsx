import React, { FC } from 'react';
import { DashboardLayoutParams } from '../../layout';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { sql } from 'drizzle-orm';
import { db } from '@/config/db/neon/initialize';
import { stores } from '@/schema/store';
import { SettingsForm } from './components/setting-form';

interface SettingsPageParams extends DashboardLayoutParams {}

interface SettingsPageProps extends PageBaseProps {
  params: SettingsPageParams;
}

const SettingsPage: FC<SettingsPageProps> = async ({ params }) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');
  const { storeId } = params;

  const store = await db.query.stores.findFirst({
    where: sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`,
  });

  if (!store) return redirect('/');

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SettingsForm store={store} />
      </div>
    </div>
  );
};

export default SettingsPage;
