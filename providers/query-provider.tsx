'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FC } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
