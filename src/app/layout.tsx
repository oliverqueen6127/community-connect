import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import ToastContainer from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Community Connect USA — AI-Powered Community Platform',
  description: 'Discover halal restaurants, mosques, housing, jobs, and events in your community with AI-powered search.',
  keywords: ['halal', 'community', 'muslim', 'restaurants', 'jobs', 'housing', 'events', 'directory'],
  openGraph: {
    title: 'Community Connect USA',
    description: 'AI-Powered Community Discovery Platform',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1B4332',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F9FA] antialiased">
        <AppProvider>
          <Header />
          <main className="pb-20 md:pb-0 min-h-screen">
            {children}
          </main>
          <BottomNav />
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
