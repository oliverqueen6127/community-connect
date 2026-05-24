'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useLanguage } from '@/lib/language-context';
import { US_CITIES } from '@/lib/data';
import HamburgerMenu from './HamburgerMenu';

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
  const { selectedCity, setSelectedCity, setSelectedState } = useApp();
  const { lang, setLang } = useLanguage();
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelectCity = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
  };

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-white/8">
        <div className="flex items-center h-[60px] px-3 gap-2">

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 15px rgba(0,227,140,0.4)' }}
            >
              <svg className="w-4 h-4 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-black text-sm gradient-text">CC AI</span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* City button */}
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass text-xs text-white/70 hover:text-white transition-all max-w-[100px]"
          >
            <svg className="w-3 h-3 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="font-medium truncate">{selectedCity}</span>
          </button>

          {/* Language mini-toggle */}
          <div className="flex gap-0.5 flex-shrink-0">
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
        </div>
      </header>

      {/* Hamburger slide menu */}
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* City dropdown */}
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
