import type { Metadata } from 'next';
import { Providers } from './providers';
import { ErrorBoundary } from '@/shared/components/feedback/error-boundary';
import './globals.css';
import Navbar from '@/features/home/components/Navbar';

export const metadata: Metadata = {
  title: 'Draft Kit UI',
  description: 'Fantasy Baseball Draft Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
