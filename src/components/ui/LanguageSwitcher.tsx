'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Language } from '@/lib/types';

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        title="Change language"
        className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-gray-200 hover:border-[#52B788] text-sm text-gray-700 transition-all bg-white"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden md:inline text-xs font-medium">{current.code.toUpperCase()}</span>
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden" style={{ animation: 'slideDown 0.15s ease' }}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                lang === l.code ? 'bg-[#1B4332]/5 text-[#1B4332] font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && (
                <svg className="w-3.5 h-3.5 ml-auto text-[#52B788]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
