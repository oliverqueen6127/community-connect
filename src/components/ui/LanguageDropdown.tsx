'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';

const LANGS = [
  { code: 'en' as const, label: 'English', flag: '🇺🇸', short: 'EN' },
  { code: 'fr' as const, label: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'ar' as const, label: 'العربية', flag: '🇸🇦', short: 'AR' },
];

export default function LanguageDropdown() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all duration-200"
        style={{
          background: open ? 'rgba(0,227,140,0.12)' : 'rgba(255,255,255,0.06)',
          border: open ? '1px solid rgba(0,227,140,0.35)' : '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <svg className="w-3.5 h-3.5 text-[#00E38C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{current.short}</span>
        <svg
          className={`w-3 h-3 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 z-[999] rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(5,8,22,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,227,140,0.08)',
            animation: 'slideDown 0.15s ease',
          }}
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className={`text-sm font-medium flex-1 ${lang === l.code ? 'text-white' : 'text-white/55'}`}>
                {l.label}
              </span>
              {lang === l.code && (
                <svg className="w-4 h-4 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
