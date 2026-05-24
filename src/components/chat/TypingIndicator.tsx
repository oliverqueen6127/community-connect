'use client';

import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,227,140,0.2), rgba(0,194,255,0.2))',
          border: '1px solid rgba(0,227,140,0.3)',
          boxShadow: '0 0 12px rgba(0,227,140,0.2)',
        }}
      >
        <svg className="w-4 h-4 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="glass-card border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#00E38C]"
              style={{
                animation: 'bounce 1.2s ease infinite',
                animationDelay: `${i * 0.2}s`,
                boxShadow: '0 0 6px rgba(0,227,140,0.6)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
