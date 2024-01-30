import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { db } from '@/config/db/neon/initialize';
import { sql } from 'drizzle-orm';
import { stores } from '@/schema/store';
import { Navbar } from '@/components/Navbar';
import React from 'react';

export const dynamic = 'force-dynamic';

export type DashboardLayoutParams = { storeId: string };

interface DashboardLayoutProps {
  params: { storeId: string };
  children: React.ReactNode;
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
      <Navbar />
      {children}
    </>
  );
}
