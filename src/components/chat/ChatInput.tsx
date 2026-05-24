'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/language-context';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  compact?: boolean;
  hero?: boolean;
}

const LANG_TO_BCP47: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-SA',
};

export default function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Ask anything about your community...',
  compact = false,
  hero = false,
}: ChatInputProps) {
  const { lang } = useLanguage();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Tracks committed (finalized) transcript text across interim updates
  const committedRef = useRef('');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, hero ? 200 : 160) + 'px';
    }
  }, [input, hero]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SR) {
      setVoiceError('Voice input is not supported on this browser. Try Chrome or Safari.');
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    if (listening) {
      stopListening();
      return;
    }

    // Snapshot whatever is already in the input as the committed base
    committedRef.current = input.trim() ? input.trim() + ' ' : '';

    try {
      const recognition = new SR();
      recognition.lang = LANG_TO_BCP47[lang] ?? 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);

      recognition.onend = () => {
        setListening(false);
        // Keep whatever text is currently in the input (includes last final transcript)
        textareaRef.current?.focus();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        setListening(false);
        if (e.error === 'no-speech') return; // silent — user just didn't speak
        if (e.error === 'not-allowed' || e.error === 'permission-denied' || e.error === 'service-not-allowed') {
          setVoiceError('Microphone access denied. Allow microphone access in your browser settings.');
        } else {
          setVoiceError('Voice input error. Please try again.');
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        let interimText = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript: string = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            committedRef.current += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        // Show committed + in-progress interim text in real time
        setInput(committedRef.current + interimText);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceError('Failed to start voice input. Please try again.');
      setTimeout(() => setVoiceError(null), 4000);
    }
  }, [listening, input, lang, stopListening]);

  const handleSend = () => {
    // Stop listening before sending
    if (listening) stopListening();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    committedRef.current = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasInput = input.trim().length > 0;

  /* ── Mic button — shared between hero and standard ── */
  const MicButton = () => (
    <button
      onClick={startListening}
      type="button"
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
      className="p-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center flex-shrink-0"
      style={
        listening
          ? {
              background: 'rgba(0,227,140,0.15)',
              border: '1px solid rgba(0,227,140,0.5)',
              boxShadow: '0 0 20px rgba(0,227,140,0.4)',
            }
          : {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
            }
      }
    >
      {listening ? (
        /* Stop / pulse icon */
        <svg className="w-5 h-5 text-[#00E38C] animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        /* Mic icon */
        <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );

  /* ── HERO MODE ── */
  if (hero) {
    return (
      <div className={`ai-input-border${isFocused ? ' focused' : ''}`}>
        {/* Listening / error indicator */}
        {(listening || voiceError) && (
          <div className="flex items-center gap-2 px-5 pt-4 pb-0 md:px-7">
            {listening ? (
              <>
                <span
                  className="w-2 h-2 rounded-full bg-[#00E38C] animate-pulse flex-shrink-0"
                  style={{ boxShadow: '0 0 8px rgba(0,227,140,0.9)' }}
                />
                <span className="text-sm font-medium text-[#00E38C]">Listening...</span>
                <span className="text-xs text-white/30 ml-1">(speak now)</span>
              </>
            ) : voiceError ? (
              <span className="text-sm font-medium text-red-400">{voiceError}</span>
            ) : null}
          </div>
        )}
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
            onChange={(e) => {
              setInput(e.target.value);
              committedRef.current = e.target.value;
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={listening ? 'Listening...' : placeholder}
            rows={2}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-base md:text-lg text-white focus:outline-none leading-relaxed py-1"
            style={{ minHeight: '60px', maxHeight: '200px', caretColor: '#00E38C', color: '#fff' }}
          />

          {/* Mic */}
          <MicButton />

          {/* Send */}
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
    <div>
      {/* Error banner */}
      {voiceError && (
        <div className="mb-2 px-4 py-2 rounded-xl text-xs text-red-400 bg-red-500/10 border border-red-500/20">
          {voiceError}
        </div>
      )}
      {listening && (
        <div className="mb-2 px-4 py-1.5 rounded-xl text-xs flex items-center gap-2" style={{ background: 'rgba(0,227,140,0.08)', border: '1px solid rgba(0,227,140,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E38C] animate-pulse" style={{ boxShadow: '0 0 6px rgba(0,227,140,0.9)' }} />
          <span className="text-[#00E38C] font-medium">Listening... speak now</span>
        </div>
      )}
      <div
        className={`relative transition-all duration-300 ${compact ? 'rounded-2xl' : 'rounded-3xl'}`}
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: hasInput || listening
            ? '1px solid rgba(0,227,140,0.5)'
            : '1px solid rgba(255,255,255,0.1)',
          boxShadow: hasInput || listening
            ? '0 0 25px rgba(0,227,140,0.15), 0 0 0 3px rgba(0,227,140,0.05)'
            : 'none',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            committedRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          placeholder={listening ? 'Listening...' : placeholder}
          rows={1}
          disabled={isLoading}
          className={`w-full resize-none bg-transparent ${
            compact ? 'px-4 py-3 pr-24 text-sm' : 'px-6 py-5 pr-28 text-base'
          } text-white placeholder-white/25 focus:outline-none leading-relaxed`}
          style={{ maxHeight: '160px' }}
        />
        <div className={`absolute ${compact ? 'bottom-1.5 right-1.5' : 'bottom-2.5 right-2.5'} flex items-center gap-1.5`}>
          {/* Compact mic */}
          <button
            onClick={startListening}
            type="button"
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl transition-all duration-300 flex-shrink-0`}
            style={
              listening
                ? { background: 'rgba(0,227,140,0.15)', border: '1px solid rgba(0,227,140,0.4)', boxShadow: '0 0 12px rgba(0,227,140,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {listening ? (
              <svg className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#00E38C] animate-pulse`} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white/35`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!hasInput || isLoading}
            className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl transition-all duration-300 flex-shrink-0 ${
              hasInput && !isLoading
                ? 'shadow-lg hover:shadow-[0_0_20px_rgba(0,227,140,0.4)] hover:scale-105 active:scale-95'
                : 'bg-white/5 cursor-not-allowed'
            }`}
            style={hasInput && !isLoading ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
          >
            {isLoading ? (
              <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white animate-spin`} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${hasInput ? 'text-[#050816]' : 'text-white/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
