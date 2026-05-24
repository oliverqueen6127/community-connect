'use client';

import React, { useState } from 'react';
import { Event } from '@/lib/types';
import ContactModal from '@/components/ui/ContactModal';
import { useLanguage } from '@/lib/language-context';

interface EventCardProps {
  event: Event;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function EventCard({ event, onSave, isSaved = false }: EventCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const { t } = useLanguage();

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const spotsLeft = event.maxAttendees ? event.maxAttendees - event.attendees : null;

  return (
    <>
      <div className="group glass-card rounded-2xl overflow-hidden flex flex-col border border-white/8 hover:border-[#00C2FF]/30">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-white/5">
          {!imgError ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,194,255,0.1))' }}>
              <span className="text-4xl">🎉</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Price badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              event.isFree
                ? 'bg-[#00E38C]/15 text-[#00E38C] border border-[#00E38C]/30'
                : 'bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/30'
            }`}>
              {event.isFree ? t('common', 'free') : `$${event.price}`}
            </span>
          </div>

          {/* Save */}
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isSaved ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white/60 hover:text-red-400'
            }`}
          >
            <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Date badge */}
          <div className="absolute bottom-3 left-3 glass border border-white/15 rounded-xl px-3 py-1.5 text-center">
            <div className="text-[10px] font-bold text-[#00E38C] uppercase tracking-wide">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div className="text-lg font-black text-white leading-none">
              {new Date(event.date).getDate()}
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-2">{event.title}</h3>

          <div className="space-y-1.5 mb-3 text-xs text-white/30">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#00C2FF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formattedDate} · {event.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#00C2FF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="line-clamp-1">{event.location}, {event.city}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#00C2FF] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.attendees.toLocaleString()} attending {spotsLeft !== null ? `· ${spotsLeft} spots left` : ''}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-auto">
            <button className="flex-1 py-2 text-xs font-bold rounded-xl text-[#050816] transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
              {t('common', 'rsvp')}
            </button>
            <button
              onClick={() => setShowContact(true)}
              className="px-3 py-2 text-xs font-semibold border border-white/15 rounded-xl text-white/50 hover:text-white hover:border-[#00C2FF]/40 transition-all"
            >
              {t('common', 'contact')}
            </button>
          </div>
        </div>
      </div>

      {showContact && (
        <ContactModal
          listingId={event.id}
          listingTitle={event.title}
          listingType="event"
          ownerName={event.organizer}
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
}
