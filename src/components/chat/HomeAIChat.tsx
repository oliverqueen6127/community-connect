'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AISearchResponse } from '@/lib/types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import TypingIndicator from './TypingIndicator';

export default function HomeAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        }),
      });

      const data: AISearchResponse = await response.json();

      addMessage({
        role: 'assistant',
        content: data.message || 'I found some results for you!',
        results: data.results || [],
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'Sorry, I had trouble processing your request. Please try again!',
        results: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;
    setMessages((prev) => prev.filter((m) => m.id !== prev[prev.length - 1].id));
    await sendMessage(lastUserMessage.content);
  };

  const clearChat = () => {
    setMessages([]);
    setHasStarted(false);
  };

  if (!hasStarted) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] mb-4 shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Community Connect <span className="text-[#52B788]">AI</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Discover businesses, jobs, housing, and events with the power of AI. Just ask anything.
            </p>
          </div>

          <div className="mb-6">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </div>

          <SuggestionChips onSelect={sendMessage} />
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-sm">Community Connect AI</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto py-4 space-y-2">
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

      <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <ChatInput onSend={sendMessage} isLoading={isLoading} compact />
      </div>
    </section>
  );
}
