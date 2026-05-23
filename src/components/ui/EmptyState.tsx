'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  city?: string;
}

export default function EmptyState({ icon = '🔍', title, description, actionLabel, onAction, city }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-6xl mb-5 animate-bounce" style={{ animationDuration: '2s' }}>{icon}</div>
      <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
      {city && (
        <div className="flex items-center gap-1.5 mb-2 text-[#1B4332] font-semibold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {city}
        </div>
      )}
      <p className="text-gray-500 text-sm max-w-xs mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
