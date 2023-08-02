'use client';

import { FC, ReactNode } from 'react';

interface ClientProps {
  children: ReactNode;
}

export const Client: FC<ClientProps> = ({ children }) => <>{children}</>;
