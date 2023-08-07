import './globals.css';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { ModalProvider } from '../providers/modal-provider';
import { QueryProvider } from '../providers/query-provider';
import { ToasterProvider } from '../providers/toast-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <QueryProvider>
            <ToasterProvider />
            <ModalProvider />
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
