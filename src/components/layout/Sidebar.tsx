'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';
import { US_CITIES } from '@/lib/data';

const NAV_ITEMS = [
  {
    href: '/',
    key: 'home',
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/directory',
    key: 'directory',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    href: '/events',
    key: 'events',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/housing',
    key: 'housing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/jobs',
    key: 'jobs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/messages',
    key: 'messages',
    showBadge: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: '/favorites',
    key: 'favorites',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

function CitySelector({ selectedCity, onSelect }: { selectedCity: string; onSelect: (city: string, state: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = US_CITIES.filter(
    (c) => search.length === 0 || c.city.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass text-sm text-white/70 hover:text-white transition-all"
      >
        <svg className="w-3.5 h-3.5 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <span className="flex-1 text-left truncate font-medium">{selectedCity}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 glass rounded-xl overflow-hidden z-50" style={{ animation: 'slideDown 0.2s ease' }}>
          <div className="p-2 border-b border-white/10">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city..."
              autoFocus
              className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#00E38C]/50"
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={`${c.city}-${c.state}`}
                onClick={() => { onSelect(c.city, c.state); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex justify-between ${c.city === selectedCity ? 'text-[#00E38C]' : 'text-white/70'}`}
              >
                <span>{c.city}</span>
                <span className="text-white/30">{c.state}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const langs: { code: 'en' | 'fr' | 'ar'; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`flex-1 text-xs py-1 rounded-lg font-medium transition-all ${
            lang === l.code
              ? 'bg-[#00E38C] text-[#050816] font-bold'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, selectedCity, setSelectedCity, setSelectedState } = useApp();
  const { unreadUserCount } = useMessages();
  const { t } = useLanguage();

  const unread = user ? unreadUserCount(user.id) : 0;

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-40 glass border-r border-white/8">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 20px rgba(0,227,140,0.4)' }}>
            <svg className="w-5 h-5 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-black text-white leading-none">Community</div>
            <div className="text-xs font-black leading-none" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connect AI</div>
          </div>
        </Link>
      </div>

      {/* City selector */}
      <div className="px-3 pb-4">
        <CitySelector selectedCity={selectedCity} onSelect={(city, state) => { setSelectedCity(city); setSelectedState(state); }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <span className="relative flex-shrink-0">
                {item.icon}
                {item.showBadge && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <span>{t('nav', item.key)}</span>
            </Link>
          );
        })}

        <div className="pt-3 pb-1">
          <div className="h-px bg-white/8 mx-2" />
        </div>

        <Link href="/add-listing" className="sidebar-link">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
          </svg>
          <span>{t('nav', 'addListing')}</span>
        </Link>

        {user?.role === 'admin' && (
          <Link href="/admin" className={`sidebar-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3 border-t border-white/8 pt-3">
        {/* Language */}
        <LanguageToggle />

        {/* User */}
        {user ? (
          <div className="space-y-1">
            <Link href="/profile" className="sidebar-link">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#050816] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-white/30 truncate">{user.role}</p>
              </div>
            </Link>
            <button
              onClick={logout}
              className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-xs">Sign out</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login" className="flex-1 text-center py-2 text-xs font-semibold rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all">
              Sign In
            </Link>
            <Link href="/auth/register" className="flex-1 text-center py-2 text-xs font-bold rounded-xl text-[#050816] transition-all"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
              Join
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
