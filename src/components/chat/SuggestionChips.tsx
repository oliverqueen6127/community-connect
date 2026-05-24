'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

const CHIP_KEYS = [
  { key: 'halalRestaurants', icon: '🍽️', query: 'Find halal restaurants near me' },
  { key: 'mosquesNearMe', icon: '🕌', query: 'Find a mosque near me' },
  { key: 'jobsHiring', icon: '💼', query: 'Show jobs hiring now' },
  { key: 'apartmentsUnder', icon: '🏠', query: 'Show apartments under $1500 for rent' },
  { key: 'freeEvents', icon: '🎉', query: 'What free community events are happening?' },
  { key: 'halalGrocery', icon: '🛒', query: 'Find halal grocery stores' },
  { key: 'jobNearMe', icon: '🔍', query: 'I am looking for a job near me' },
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2.5 justify-center">
      {CHIP_KEYS.map((s) => (
        <button
          key={s.key}
          onClick={() => onSelect(s.query)}
          className="suggestion-chip"
        >
          <span className="text-base">{s.icon}</span>
          <span>{t('chatbot', s.key)}</span>
        </button>
      ))}
    </div>
  );
}
