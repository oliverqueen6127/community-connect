'use client';

import React, { useState } from 'react';
import { Event } from '@/lib/types';
import Badge from '@/components/ui/Badge';
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
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col">
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {!imgError ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
              <span className="text-white text-4xl">🎉</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={event.isFree ? 'green' : 'blue'}>
              {event.isFree ? t('common', 'free') : `$${event.price}`}
            </Badge>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center shadow">
            <div className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">
              {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
            </div>
            <div className="text-lg font-black text-gray-900 leading-none">
              {new Date(event.date).getDate()}
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">{event.title}</h3>

          <div className="space-y-1.5 mb-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#52B788] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formattedDate} · {event.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#52B788] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="line-clamp-1">{event.location}, {event.city}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#52B788] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.attendees.toLocaleString()} attending {spotsLeft !== null ? `· ${spotsLeft} spots left` : ''}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-auto">
            <button className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white rounded-xl hover:opacity-90 transition-opacity">
              {t('common', 'rsvp')}
            </button>
            <button
              onClick={() => setShowContact(true)}
              className="px-4 py-2.5 text-sm font-medium text-[#1B4332] border border-[#1B4332] rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors"
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
