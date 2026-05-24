'use client';

import React from 'react';

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#050816]" />

      {/* Star field */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.3,
      }} />

      {/* Aurora blob 1 — green */}
      <div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          top: '-100px',
          left: '-100px',
          background: 'radial-gradient(circle, rgba(0,227,140,0.25) 0%, rgba(0,227,140,0.05) 60%, transparent 100%)',
          filter: 'blur(60px)',
          animation: 'auroraBlob1 18s ease-in-out infinite',
        }}
      />

      {/* Aurora blob 2 — blue */}
      <div
        className="absolute rounded-full"
        style={{
          width: '700px',
          height: '700px',
          bottom: '-150px',
          right: '-150px',
          background: 'radial-gradient(circle, rgba(0,194,255,0.2) 0%, rgba(0,194,255,0.05) 60%, transparent 100%)',
          filter: 'blur(80px)',
          animation: 'auroraBlob2 24s ease-in-out infinite',
        }}
      />

      {/* Aurora blob 3 — purple accent */}
      <div
        className="absolute rounded-full"
        style={{
          width: '400px',
          height: '400px',
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(0,194,255,0.06) 60%, transparent 100%)',
          filter: 'blur(60px)',
          animation: 'auroraBlob3 20s ease-in-out infinite',
        }}
      />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '100px 100px',
      }} />
    </div>
  );
}
