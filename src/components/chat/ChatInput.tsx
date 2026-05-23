'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  compact?: boolean;
}

export default function ChatInput({ onSend, isLoading, placeholder = 'Ask anything about your community...', compact = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`relative bg-white border-2 ${compact ? 'border-gray-200 rounded-2xl' : 'border-gray-200 rounded-3xl shadow-xl'} hover:border-[#52B788] focus-within:border-[#1B4332] transition-all duration-300`}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className={`w-full resize-none bg-transparent ${compact ? 'px-4 py-3 pr-12 text-sm' : 'px-6 py-5 pr-16 text-base'} text-gray-800 placeholder-gray-400 focus:outline-none rounded-3xl leading-relaxed`}
        style={{ maxHeight: '160px' }}
      />

      <div className={`absolute ${compact ? 'bottom-2 right-2' : 'bottom-3 right-3'} flex items-center gap-2`}>
        {input.length > 0 && !isLoading && (
          <span className="text-xs text-gray-300">{input.length}</span>
        )}

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`${compact ? 'p-2' : 'p-3'} rounded-2xl transition-all duration-300 flex-shrink-0 ${
            input.trim() && !isLoading
              ? 'bg-gradient-to-br from-[#1B4332] to-[#52B788] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
