'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useLanguage } from '@/lib/language-context';
import { US_CITIES } from '@/lib/data';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const NAV_HREFS = ['/directory', '/events', '/housing', '/jobs'] as const;
const NAV_KEYS = ['directory', 'events', 'housing', 'jobs'] as const;

function CityDropdown({
  selectedCity,
  onSelect,
  onClose,
  isMobile,
}: {
  selectedCity: string;
  onSelect: (city: string, state: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = US_CITIES.filter(
    (c) =>
      search.length === 0 ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10);

  return (
    <div
      className={
        isMobile
          ? 'fixed left-0 right-0 top-[64px] z-50 bg-white border-b border-gray-100 shadow-xl'
          : 'absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden'
      }
      style={{ animation: 'slideDown 0.2s ease' }}
    >
      <div className={`p-3 border-b border-gray-50 ${isMobile ? 'px-4' : ''}`}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="City, State or ZIP"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] bg-gray-50"
          />
        </div>
      </div>
      <div className={`overflow-y-auto ${isMobile ? 'max-h-64' : 'max-h-56'}`}>
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No cities found</div>
        ) : (
          filtered.map((c) => (
            <button
              key={`${c.city}-${c.state}`}
              onClick={() => { onSelect(c.city, c.state); onClose(); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-[#1B4332]/5 transition-colors flex justify-between items-center ${
                c.city === selectedCity ? 'bg-[#1B4332]/8 text-[#1B4332] font-semibold' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#52B788] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{c.city}</span>
              </div>
              <span className="text-gray-400 text-xs">{c.state}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: { name: string; role: string }; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user.name.charAt(0)}
        </div>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name}</span>
        <svg className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden" style={{ animation: 'slideDown 0.15s ease' }}>
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mon profil
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1B4332] font-semibold hover:bg-[#1B4332]/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Admin Dashboard
              </Link>
            )}
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, logout, selectedCity, setSelectedCity, setSelectedState } = useApp();
  const { t } = useLanguage();
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const handleSelectCity = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-[#1B4332] text-sm leading-none">Community</div>
                <div className="font-black text-[#52B788] text-sm leading-none">Connect USA</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {NAV_HREFS.map((href, i) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active ? 'bg-[#1B4332] text-white' : 'text-gray-600 hover:text-[#1B4332] hover:bg-[#1B4332]/5'
                    }`}
                  >
                    {t('nav', NAV_KEYS[i])}
                  </Link>
                );
              })}
            </nav>

            {/* Right side: city + language + auth */}
            <div className="flex items-center gap-2">

              {/* City selector — visible on ALL screen sizes */}
              <div className="relative">
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="flex items-center gap-1.5 px-2.5 py-2 sm:px-3 rounded-xl border border-gray-200 hover:border-[#52B788] text-sm text-gray-700 transition-all duration-200 bg-white max-w-[130px] sm:max-w-none"
                >
                  <svg className="w-3.5 h-3.5 text-[#52B788] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="font-medium truncate">{selectedCity}</span>
                  <svg
                    className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Desktop dropdown */}
                {showCityDropdown && (
                  <div className="hidden sm:block">
                    <CityDropdown
                      selectedCity={selectedCity}
                      onSelect={handleSelectCity}
                      onClose={() => setShowCityDropdown(false)}
                    />
                  </div>
                )}
              </div>

              <LanguageSwitcher />

              {/* Auth */}
              {user ? (
                <UserMenu user={user} onLogout={() => { logout(); }} />
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#1B4332] transition-colors hidden sm:block"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/login"
                    className="sm:hidden px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:border-[#52B788] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3 py-2 text-sm font-semibold bg-[#1B4332] text-white rounded-xl hover:bg-[#0f2d21] transition-colors shadow-sm"
                  >
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile city dropdown — full-width overlay below header */}
      {showCityDropdown && (
        <>
          <div className="sm:hidden">
            <CityDropdown
              selectedCity={selectedCity}
              onSelect={handleSelectCity}
              onClose={() => setShowCityDropdown(false)}
              isMobile
            />
          </div>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
            style={{ top: '64px' }}
            onClick={() => setShowCityDropdown(false)}
          />
        </>
      )}
    </>
  );
}
