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
  { label: 'Job Near Me', icon: '🔍', query: 'I am looking for a job near me' },
];

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2.5 justify-center">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.query)}
          className="suggestion-chip"
        >
          <span className="text-base">{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
