'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useLanguage } from '@/lib/language-context';
import { US_CITIES } from '@/lib/data';

function CityDropdown({
  selectedCity,
  onSelect,
  onClose,
}: {
  selectedCity: string;
  onSelect: (city: string, state: string) => void;
  onClose: () => void;
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
      className="fixed left-0 right-0 top-[60px] z-50 glass border-b border-white/10 shadow-2xl"
      style={{ animation: 'slideDown 0.2s ease' }}
    >
      <div className="p-3 border-b border-white/8 px-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#00E38C]/50 text-white placeholder-white/30"
          />
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={`${c.city}-${c.state}`}
            onClick={() => { onSelect(c.city, c.state); onClose(); }}
            className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex justify-between items-center ${
              c.city === selectedCity ? 'text-[#00E38C]' : 'text-white/70'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>{c.city}</span>
            </div>
            <span className="text-white/30 text-xs">{c.state}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const { user, logout, selectedCity, setSelectedCity, setSelectedState } = useApp();
  const { lang, setLang } = useLanguage();
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectCity = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-white/8">
        <div className="flex items-center justify-between h-[60px] px-4 gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 15px rgba(0,227,140,0.4)' }}>
              <svg className="w-4 h-4 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-black text-sm gradient-text">CC AI</span>
          </Link>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* City button */}
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-xs text-white/70 hover:text-white transition-all max-w-[110px]"
            >
              <svg className="w-3 h-3 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="font-medium truncate">{selectedCity}</span>
            </button>

            {/* Language mini-toggle */}
            <div className="flex gap-0.5">
              {(['en', 'fr', 'ar'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                    lang === l ? 'bg-[#00E38C] text-[#050816]' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#050816] flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
                >
                  {user.name.charAt(0)}
                </button>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass rounded-2xl overflow-hidden z-50 border border-white/10" style={{ animation: 'slideDown 0.15s ease' }}>
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-white/40">{user.role}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Mon profil
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#00E38C] hover:bg-[#00E38C]/5 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                          Admin
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-white/8 py-1">
                      <button onClick={() => { setShowUserMenu(false); logout(); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="px-3 py-1.5 text-xs font-bold rounded-xl text-[#050816]"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile city dropdown */}
      {showCityDropdown && (
        <>
          <div className="lg:hidden">
            <CityDropdown
              selectedCity={selectedCity}
              onSelect={handleSelectCity}
              onClose={() => setShowCityDropdown(false)}
            />
          </div>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/50"
            style={{ top: '60px' }}
            onClick={() => setShowCityDropdown(false)}
          />
        </>
      )}
    </>
  );
}
