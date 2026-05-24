'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { ToastNotification } from '@/lib/types';

function ToastItem({ toast, onRemove }: { toast: ToastNotification; onRemove: () => void }) {
  const config = {
    success: { icon: '✓', color: '#00E38C', border: 'rgba(0,227,140,0.4)' },
    error: { icon: '✕', color: '#f87171', border: 'rgba(248,113,113,0.4)' },
    info: { icon: 'ℹ', color: '#00C2FF', border: 'rgba(0,194,255,0.4)' },
    warning: { icon: '⚠', color: '#fbbf24', border: 'rgba(251,191,36,0.4)' },
  };

  const { icon, color, border } = config[toast.type];

  return (
    <div
      className="flex items-center gap-3 glass border rounded-xl p-4 min-w-[280px] max-w-sm shadow-2xl"
      style={{ borderColor: border, animation: 'slideInRight 0.3s ease', boxShadow: `0 0 20px ${color}20` }}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
        {icon}
      </span>
      <p className="text-sm text-white/80 flex-1">{toast.message}</p>
      <button onClick={onRemove} className="text-white/30 hover:text-white/60 ml-2 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 lg:bottom-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
