'use client';

import React, { useState, useMemo } from 'react';
import { EVENTS } from '@/lib/data';
import EventCard from '@/components/cards/EventCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';
import { useListings } from '@/lib/listings-context';
import { useFavorites } from '@/lib/favorites-context';
import { Event } from '@/lib/types';

const CATEGORIES = ['All', 'fundraiser', 'religious', 'food', 'education', 'community', 'sports', 'business'];

export default function EventsPage() {
  const { selectedCity, selectedState } = useApp();
  const { toggleSaved, isSaved } = useFavorites();
  const { activeListings } = useListings();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFree, setShowFree] = useState(false);

  const userEvents = useMemo(
    () => activeListings.filter((l) => l.type === 'event').map((l) => l.data as Event),
    [activeListings]
  );

  const allEvents = useMemo(
    () => {
      const staticIds = new Set(EVENTS.map((e) => e.id));
      const newOnes = userEvents.filter((e) => !staticIds.has(e.id));
      return [...EVENTS, ...newOnes];
    },
    [userEvents]
  );

  const byCity = useMemo(
    () => allEvents.filter((e) => e.city.toLowerCase() === selectedCity.toLowerCase()),
    [allEvents, selectedCity]
  );

  const filtered = useMemo(() => {
    let results = byCity;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') results = results.filter((e) => e.category === selectedCategory);
    if (showFree) results = results.filter((e) => e.isFree);
    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [byCity, search, selectedCategory, showFree]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1">Community Events</h1>
        <div className="flex items-center gap-1.5 text-sm text-white/40">
          <svg className="w-4 h-4 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Events in <span className="font-semibold text-[#00E38C] ml-1">{selectedCity}, {selectedState}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass border border-white/8 rounded-2xl p-4 mb-6 space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search events in ${selectedCity}...`}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  selectedCategory === cat ? 'text-[#050816]' : 'glass border border-white/10 text-white/40 hover:text-white hover:border-white/20'
                }`}
                style={selectedCategory === cat ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <div onClick={() => setShowFree(!showFree)} className={`relative w-10 h-5 rounded-full transition-colors ${showFree ? 'bg-[#00E38C]' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showFree ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/40">Free Only</span>
          </label>
        </div>
      </div>

      <p className="text-sm text-white/30 mb-4">{filtered.length} {filtered.length === 1 ? 'event' : 'events'} in {selectedCity}</p>

      {byCity.length === 0 ? (
        <EmptyState icon="📅" title="No events in this city" description={`No events in ${selectedCity} yet.`} city={`${selectedCity}, ${selectedState}`} actionLabel="Change Location" onAction={() => {}} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matching events" description={`No events match your filters.`} actionLabel="Clear Filters" onAction={() => { setSearch(''); setSelectedCategory('All'); setShowFree(false); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} onSave={() => toggleSaved('events', event.id)} isSaved={isSaved('events', event.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
