'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname === '/') return null;

  return (
    <button
      onClick={() => router.back()}
      aria-label={t('nav', 'back')}
      className="lg:hidden fixed top-[70px] left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 glass border border-white/10 rounded-xl text-white/50 hover:text-white transition-all duration-200 text-sm font-medium"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
