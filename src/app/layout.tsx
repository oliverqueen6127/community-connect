import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { LanguageProvider } from '@/lib/language-context';
import { MessagesProvider } from '@/lib/messages-context';
import { ListingsProvider } from '@/lib/listings-context';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import ToastContainer from '@/components/ui/Toast';
import BackButton from '@/components/ui/BackButton';
import SupportChat from '@/components/ui/SupportChat';
import AuroraBackground from '@/components/ui/AuroraBackground';

export const metadata: Metadata = {
  title: 'Community Connect AI — AI-Powered Community Platform',
  description: 'Discover halal restaurants, mosques, housing, jobs, and events in your community with AI-powered search.',
  keywords: ['halal', 'community', 'muslim', 'restaurants', 'jobs', 'housing', 'events', 'directory'],
  openGraph: {
    title: 'Community Connect AI',
    description: 'AI-Powered Community Discovery Platform',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050816',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050816] text-white antialiased">
        <AppProvider>
          <LanguageProvider>
            <MessagesProvider>
              <ListingsProvider>
                {/* Aurora background — fixed, behind everything */}
                <AuroraBackground />

                {/* Desktop sidebar */}
                <Sidebar />

                {/* Mobile header */}
                <Header />

                {/* Back button (mobile only, hidden on desktop via lg:hidden) */}
                <BackButton />

                {/* Main content — offset for sidebar on desktop */}
                <main className="relative z-10 pb-20 lg:pb-0 lg:ml-64 min-h-screen">
                  {children}
                </main>

                {/* Mobile bottom nav */}
                <BottomNav />

                <ToastContainer />
                <SupportChat />
              </ListingsProvider>
            </MessagesProvider>
          </LanguageProvider>
        </AppProvider>
      </body>
    </html>
  );
}
