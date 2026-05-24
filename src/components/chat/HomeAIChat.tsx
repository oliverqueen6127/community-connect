'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AISearchResponse } from '@/lib/types';
import { useApp } from '@/lib/context';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import TypingIndicator from './TypingIndicator';

export default function HomeAIChat() {
  const { selectedCity, selectedState } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMsg: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const sendMessage = async (content: string) => {
    if (isLoading) return;
    if (!hasStarted) setHasStarted(true);

    addMessage({ role: 'user', content });
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          location: { city: selectedCity, state: selectedState },
        }),
      });

      const data: AISearchResponse = await response.json();

      addMessage({
        role: 'assistant',
        content: data.message || `Here's what I found in ${selectedCity}!`,
        results: data.results || [],
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: `Sorry, I had trouble processing your request. Please try again!`,
        results: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;
    setMessages((prev) => prev.slice(0, -1));
    await sendMessage(lastUserMessage.content);
  };

  const clearChat = () => {
    setMessages([]);
    setHasStarted(false);
  };

  /* ── IDLE STATE — hero input + suggestion chips ── */
  if (!hasStarted) {
    return (
      <div className="w-full">
        <div className="mb-5">
          <ChatInput
            hero
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder={`Ask me about businesses, housing, jobs in ${selectedCity}...`}
          />
        </div>
        <SuggestionChips onSelect={sendMessage} />
      </div>
    );
  }

  /* ── ACTIVE CHAT STATE ── */
  return (
    <section className="flex flex-col h-[calc(100vh-130px)] md:h-[calc(100vh-70px)]">

      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 glass flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,227,140,0.2), rgba(0,194,255,0.2))',
              border: '1px solid rgba(0,227,140,0.3)',
            }}
          >
            <svg className="w-4 h-4 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm">Community Connect AI</span>
          <span className="w-2 h-2 rounded-full bg-[#00E38C] animate-pulse" style={{ boxShadow: '0 0 6px rgba(0,227,140,0.8)' }} />
          <span className="hidden sm:inline-flex items-center gap-1 glass border border-white/10 text-white/40 text-xs font-semibold rounded-full px-2 py-0.5">
            <svg className="w-3 h-3 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {selectedCity}
          </span>
        </div>

        {/* Clear button — visible, glass, red on hover */}
        <button
          onClick={clearChat}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.65)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(239,68,68,0.12)';
            el.style.borderColor = 'rgba(239,68,68,0.35)';
            el.style.color = '#f87171';
            el.style.boxShadow = '0 0 14px rgba(239,68,68,0.18)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = 'rgba(255,255,255,0.06)';
            el.style.borderColor = 'rgba(255,255,255,0.12)';
            el.style.color = 'rgba(255,255,255,0.65)';
            el.style.boxShadow = 'none';
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRegenerate={msg.role === 'assistant' && i === messages.length - 1 ? handleRegenerate : undefined}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input — hero style with animated border, always visible and usable */}
      <div className="px-3 pb-3 pt-2 border-t border-white/8 flex-shrink-0">
        <ChatInput
          hero
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder="Ask a follow-up question to refine results..."
        />
      </div>
    </section>
  );
}
