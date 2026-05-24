'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { useLanguage } from '@/lib/language-context';
import { US_CITIES } from '@/lib/data';

export default function LocationPicker() {
  const { selectedCity, selectedState, setSelectedCity, setSelectedState } = useApp();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const filtered = US_CITIES.filter(
    (c) =>
      search.length === 0 ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropWidth = Math.min(320, window.innerWidth - 32);
      let left = rect.left + rect.width / 2 - dropWidth / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - dropWidth - 16));
      setPanelStyle({ top: rect.bottom + 8, left, width: dropWidth });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setSearch('');
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger badge */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="group inline-flex items-center gap-2 glass border border-white/10 hover:border-[#00E38C]/45 rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 hover:shadow-[0_0_22px_rgba(0,227,140,0.18)]"
      >
        <svg className="w-3.5 h-3.5 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <span className="text-white/55">{t('home', 'searchingIn')}</span>
        <span className="font-black text-white">{selectedCity}, {selectedState}</span>
        <svg
          className={`w-3.5 h-3.5 text-white/25 group-hover:text-[#00E38C] transition-all duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      {/* Floating panel */}
      {open && (
        <div
          className="fixed z-50 rounded-2xl overflow-hidden"
          style={{
            ...panelStyle,
            background: 'rgba(5,8,22,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,227,140,0.06)',
            animation: 'slideDown 0.15s ease',
          }}
        >
          {/* Search */}
          <div className="p-3 border-b border-white/8">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or state..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#00E38C]/50 text-white placeholder-white/25 transition-colors"
              />
            </div>
          </div>

          {/* City list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-white/25 text-center">No cities found</p>
            ) : (
              filtered.map((c) => {
                const active = c.city === selectedCity;
                return (
                  <button
                    key={`${c.city}-${c.state}`}
                    onClick={() => handleSelect(c.city, c.state)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-white/5 ${active ? 'text-[#00E38C]' : 'text-white/65'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-[#00E38C]' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="text-sm font-medium">{c.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${active ? 'text-[#00E38C]/60' : 'text-white/25'}`}>{c.state}</span>
                      {active && (
                        <svg className="w-3.5 h-3.5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
