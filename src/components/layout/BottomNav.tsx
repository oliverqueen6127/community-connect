'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';

const NAV_ITEMS = [
  {
    href: '/',
    key: 'home',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1B4332]' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/directory',
    key: 'directory',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1B4332]' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: '/housing',
    key: 'housing',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1B4332]' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/jobs',
    key: 'jobs',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1B4332]' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/messages',
    key: 'messages',
    showBadge: true,
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-[#1B4332]' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useApp();
  const { unreadUserCount } = useMessages();
  const { t } = useLanguage();

  const unread = user ? unreadUserCount(user.id) : 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-40 md:hidden pb-safe">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 ${
                active ? 'text-[#1B4332]' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all relative ${active ? 'bg-[#1B4332]/10' : ''}`}>
                {item.icon(active)}
                {item.showBadge && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-medium leading-tight ${active ? 'text-[#1B4332]' : 'text-gray-400'}`}>
                {t('nav', item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
