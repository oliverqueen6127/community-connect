'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  compact?: boolean;
  hero?: boolean;
}

export default function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Ask anything about your community...',
  compact = false,
  hero = false,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, hero ? 200 : 160) + 'px';
    }
  }, [input, hero]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasInput = input.trim().length > 0;

  /* ── HERO MODE — large animated border input ── */
  if (hero) {
    return (
      <div className={`ai-input-border${isFocused ? ' focused' : ''}`}>
        <div className="flex items-end gap-4 px-5 py-5 md:px-7 md:py-6">
          {/* AI icon */}
          <div className="flex-shrink-0 mb-0.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,227,140,0.18), rgba(0,194,255,0.18))',
                border: '1px solid rgba(0,227,140,0.35)',
                boxShadow: '0 0 14px rgba(0,227,140,0.2)',
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: '#00E38C', filter: 'drop-shadow(0 0 4px rgba(0,227,140,0.6))' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-base md:text-lg text-white focus:outline-none leading-relaxed py-1"
            style={{
              minHeight: '60px',
              maxHeight: '200px',
              caretColor: '#00E38C',
              color: '#fff',
            }}
          />

          {/* Send button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleSend}
              disabled={!hasInput || isLoading}
              className="p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center"
              style={
                hasInput && !isLoading
                  ? {
                      background: 'linear-gradient(135deg, #00E38C, #00C2FF)',
                      boxShadow: '0 0 20px rgba(0,227,140,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }
              }
            >
              {isLoading ? (
                <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg
                  className={`w-5 h-5 ${hasInput ? 'text-[#050816]' : 'text-white/20'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── STANDARD / COMPACT MODE ── */
  return (
    <div
      className={`relative transition-all duration-300 ${compact ? 'rounded-2xl' : 'rounded-3xl'}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: hasInput ? '1px solid rgba(0,227,140,0.5)' : '1px solid rgba(255,255,255,0.1)',
        boxShadow: hasInput
          ? '0 0 25px rgba(0,227,140,0.15), 0 0 0 3px rgba(0,227,140,0.05)'
          : 'none',
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className={`w-full resize-none bg-transparent ${
          compact ? 'px-4 py-3 pr-12 text-sm' : 'px-6 py-5 pr-16 text-base'
        } text-white placeholder-white/25 focus:outline-none leading-relaxed`}
        style={{ maxHeight: '160px' }}
      />
      <div className={`absolute ${compact ? 'bottom-2 right-2' : 'bottom-3 right-3'} flex items-center gap-2`}>
        <button
          onClick={handleSend}
          disabled={!hasInput || isLoading}
          className={`${compact ? 'p-2' : 'p-3'} rounded-2xl transition-all duration-300 flex-shrink-0 ${
            hasInput && !isLoading
              ? 'text-[#050816] shadow-lg hover:shadow-[0_0_20px_rgba(0,227,140,0.4)] hover:scale-105 active:scale-95'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
          style={hasInput && !isLoading ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
        >
          {isLoading ? (
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
