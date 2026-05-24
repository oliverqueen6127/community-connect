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
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center glass-card rounded-3xl border border-white/8">
      <div className="text-6xl mb-5" style={{ animation: 'float 3s ease-in-out infinite' }}>{icon}</div>
      <h3 className="text-xl font-black text-white mb-2">{title}</h3>
      {city && (
        <div className="flex items-center gap-1.5 mb-2 text-[#00E38C] font-semibold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {city}
        </div>
      )}
      <p className="text-white/30 text-sm max-w-xs mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 text-[#050816] font-bold rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] hover:-translate-y-0.5 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
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
