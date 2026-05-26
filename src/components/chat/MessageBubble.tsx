'use client';

import React, { useState } from 'react';
import { ChatMessage, ChatActiveFilters, Listing, Business, Event as EventType, Housing, Job } from '@/lib/types';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import JobCard from '@/components/cards/JobCard';
import HousingCard from '@/components/cards/HousingCard';

interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
}

const TYPE_ICON: Record<string, string> = {
  business: '🏪',
  event: '🎉',
  housing: '🏠',
  job: '💼',
};

const CATEGORY_ICON: Record<string, string> = {
  mosque: '🕌',
  restaurant: '🍽️',
  grocery: '🛒',
  healthcare: '🏥',
  school: '📚',
  retail: '🛍️',
  services: '🔧',
  entertainment: '🎭',
};

function FilterChips({ filters }: { filters: ChatActiveFilters }) {
  const chips: { icon: string; label: string; color: string }[] = [];

  if (filters.type) {
    chips.push({ icon: TYPE_ICON[filters.type] || '📋', label: filters.type.charAt(0).toUpperCase() + filters.type.slice(1), color: 'rgba(0,194,255,0.85)' });
  }
  if (filters.city) {
    chips.push({ icon: '📍', label: filters.city, color: 'rgba(255,255,255,0.65)' });
  }
  if (filters.priceMax !== undefined) {
    chips.push({ icon: '💰', label: `Under $${filters.priceMax.toLocaleString()}`, color: 'rgba(0,227,140,0.9)' });
  }
  if (filters.priceMin !== undefined) {
    chips.push({ icon: '💰', label: `Over $${filters.priceMin.toLocaleString()}`, color: 'rgba(0,227,140,0.9)' });
  }
  if (filters.bedrooms !== undefined) {
    chips.push({ icon: '🛏️', label: `${filters.bedrooms}+ Beds`, color: 'rgba(255,255,255,0.65)' });
  }
  if (filters.listingType === 'rent') {
    chips.push({ icon: '🔑', label: 'For Rent', color: 'rgba(255,255,255,0.65)' });
  } else if (filters.listingType === 'sale') {
    chips.push({ icon: '🏷️', label: 'For Sale', color: 'rgba(255,165,0,0.9)' });
  }
  if (filters.remote) {
    chips.push({ icon: '🌐', label: 'Remote', color: 'rgba(0,194,255,0.85)' });
  }
  if (filters.isFree) {
    chips.push({ icon: '🆓', label: 'Free Only', color: 'rgba(0,227,140,0.9)' });
  }
  if (filters.category) {
    const catIcon = CATEGORY_ICON[filters.category] || '🏷️';
    chips.push({ icon: catIcon, label: filters.category.charAt(0).toUpperCase() + filters.category.slice(1), color: 'rgba(255,255,255,0.65)' });
  }
  if (filters.rating !== undefined) {
    chips.push({ icon: '⭐', label: `${filters.rating}+ Stars`, color: 'rgba(255,215,0,0.9)' });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
      <span className="text-xs text-white/25 self-center mr-0.5">Filters:</span>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: chip.color,
          }}
        >
          {chip.icon} {chip.label}
        </span>
      ))}
    </div>
  );
}

function ResultsGrid({ results }: { results: Listing[] }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((item) => {
          if (item.type === 'business') return <BusinessCard key={item.id} business={item as Business} />;
          if (item.type === 'event') return <EventCard key={item.id} event={item as EventType} />;
          if (item.type === 'job') return <JobCard key={item.id} job={item as Job} />;
          if (item.type === 'housing') return <HousingCard key={item.id} housing={item as Housing} />;
          return null;
        })}
      </div>
    </div>
  );
}

export default function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-1" style={{ animation: 'slideInRight 0.3s ease' }}>
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.1))',
            border: '1px solid rgba(0,227,140,0.25)',
          }}
        >
          <p className="text-sm text-white leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2" style={{ animation: 'slideInLeft 0.3s ease' }}>
      <div className="flex items-start gap-3">
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

        <div className="flex-1 min-w-0">
          <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 border border-white/8">
            <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
              {message.content}
              {message.isStreaming && (
                <span
                  className="inline-block w-0.5 h-[1em] bg-[#00E38C] ml-0.5 align-middle animate-pulse"
                  style={{ boxShadow: '0 0 6px rgba(0,227,140,0.8)' }}
                />
              )}
            </p>

            {!message.isStreaming && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[#00E38C]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Regenerate</span>
                  </button>
                )}

                <span className="ml-auto text-xs text-white/20">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {!message.isStreaming && message.activeFilters && (
            <FilterChips filters={message.activeFilters} />
          )}
          {message.results && message.results.length > 0 && (
            <ResultsGrid results={message.results} />
          )}
        </div>
      </div>
    </div>
  );
}
