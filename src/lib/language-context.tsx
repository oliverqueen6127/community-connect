'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Language } from './types';
import { translations } from './translations';

const LANG_KEY = 'cc-language';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (section: string, key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY) as Language | null;
      if (stored && ['en', 'fr', 'ar'].includes(stored)) setLangState(stored);
    } catch { /* ignore */ }
  }, []);

  const isRTL = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const translate = useCallback((section: string, key: string): string => {
    const s = (translations[lang] as Record<string, Record<string, string>>)?.[section];
    if (s?.[key]) return s[key];
    const fallback = (translations['en'] as Record<string, Record<string, string>>)?.[section];
    return fallback?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
