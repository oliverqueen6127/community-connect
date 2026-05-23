'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { US_CITIES } from '@/lib/data';

const navLinks = [
  { href: '/directory', label: 'Directory' },
  { href: '/events', label: 'Events' },
  { href: '/housing', label: 'Housing' },
  { href: '/jobs', label: 'Jobs' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, selectedCity, setSelectedCity, setSelectedState } = useApp();
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredCities = US_CITIES.filter(
    (c) =>
      citySearch.length === 0 ||
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
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

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#1B4332] text-white'
                      : 'text-gray-600 hover:text-[#1B4332] hover:bg-[#1B4332]/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#52B788] text-sm text-gray-700 transition-all duration-200 bg-white"
              >
                <svg className="w-3.5 h-3.5 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="font-medium">{selectedCity}</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCityDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-50">
                    <input
                      autoFocus
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Search city..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788]"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCities.map((c) => (
                      <button
                        key={`${c.city}-${c.state}`}
                        onClick={() => {
                          setSelectedCity(c.city);
                          setSelectedState(c.state);
                          setShowCityDropdown(false);
                          setCitySearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#1B4332]/5 transition-colors flex justify-between ${
                          c.city === selectedCity ? 'bg-[#1B4332]/5 text-[#1B4332] font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <span>{c.city}</span>
                        <span className="text-gray-400">{c.state}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name}</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1B4332] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold bg-[#1B4332] text-white rounded-xl hover:bg-[#0f2d21] transition-colors shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1" style={{ animation: 'slideDown 0.2s ease' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#1B4332]/5 hover:text-[#1B4332] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCityDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
      )}
    </header>
  );
}
