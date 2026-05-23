'use client';

import React from 'react';

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void;
}

const SUGGESTIONS = [
  { label: 'Halal Restaurants', icon: '🍽️', query: 'Find halal restaurants near me' },
  { label: 'Mosques Near Me', icon: '🕌', query: 'Find a mosque near me' },
  { label: 'Jobs Hiring Now', icon: '💼', query: 'Show jobs hiring now' },
  { label: 'Apartments Under $1500', icon: '🏠', query: 'Show apartments under $1500 for rent' },
  { label: 'Free Events', icon: '🎉', query: 'What free community events are happening?' },
  { label: 'Halal Grocery', icon: '🛒', query: 'Find halal grocery stores' },
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.query)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#1B4332] hover:text-white text-gray-700 border border-gray-200 hover:border-[#1B4332] rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
        >
          <span>{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
