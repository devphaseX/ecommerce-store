'use client';

import { cn } from '@/lib/utils';
import { useParams, usePathname } from 'next/navigation';
import React, { FC } from 'react';

import { DashboardLayoutParams } from '@/app/(dashboard)/[storeId]/layout';
import Link from 'next/link';
interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

type InternalRoute = { href: string; label: string; active(): boolean };
export const MainNav: FC<MainNavProps> = ({ className, ...props }) => {
  const pathname = usePathname();
  const params = useParams() as DashboardLayoutParams;

  const routes = [
    {
      href: `/${params.storeId}/settings`,
      label: 'Settings',
      active() {
        return this.href === pathname;
      },
    },
  ] as const satisfies readonly InternalRoute[];

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active()
              ? 'text-black dark:text-white'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
};
