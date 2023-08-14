'use client';

import { cn } from '@/lib/utils';
import { useParams, usePathname } from 'next/navigation';
import React, { FC } from 'react';

import { DashboardLayoutParams } from '@/app/(dashboard)/[storeId]/layout';
import Link from 'next/link';
interface MainNavProps extends React.HTMLAttributes<HTMLElement> {}

function createInternalRoute(
  href: string,
  label: string,
  getActivePath: () => string
): InternalRoute {
  return {
    href,
    label,
    active: () => {
      return (
        href === getActivePath() ||
        !!getActivePath().match(RegExp(String.raw`^/?${href}`, 'i'))
      );
    },
  };
}

type InternalRoute = { href: string; label: string; active(): boolean };
export const MainNav: FC<MainNavProps> = ({ className, ...props }) => {
  const pathname = usePathname();
  const params = useParams() as DashboardLayoutParams;

  const getActivePath = () => pathname;

  const routes: Array<InternalRoute> = [
    createInternalRoute(
      `/${params.storeId}/settings`,
      'Settings',
      getActivePath
    ),
    createInternalRoute(
      `/${params.storeId}/billboards`,
      'Billboards',
      getActivePath
    ),
    createInternalRoute(
      `/${params.storeId}/categories`,
      'Categories',
      getActivePath
    ),
    createInternalRoute(
      `/${params.storeId}/overviews`,
      'Overview',
      getActivePath
    ),
  ];

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
