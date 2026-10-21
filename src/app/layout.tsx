import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';
import Header from '@/components/header';
import FloatingAddButton from '@/components/floating-add-button';
import AdPlaceholder from '@/components/ad-placeholder';
import { cn } from '@/lib/utils';
import { AnalyticsProvider } from '@/context/analytics-provider';

export const metadata: Metadata = {
  title: 'Animal Bazaar',
  description: 'Animal Bazaar - Buy and Sell Animals',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <AnalyticsProvider>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 container py-6">{children}</main>
              <FloatingAddButton />
              <AdPlaceholder />
            </div>
            <Toaster />
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
