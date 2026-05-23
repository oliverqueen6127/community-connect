'use client';

import React, { useState, useMemo } from 'react';
import { EVENTS } from '@/lib/data';
import EventCard from '@/components/cards/EventCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';

const CATEGORIES = ['All', 'fundraiser', 'religious', 'food', 'education', 'community', 'sports', 'business'];

export default function EventsPage() {
  const { toggleSaved, isSaved, selectedCity, selectedState } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFree, setShowFree] = useState(false);

  // Strict city filter first
  const byCity = useMemo(
    () => EVENTS.filter((e) => e.city.toLowerCase() === selectedCity.toLowerCase()),
    [selectedCity]
  );

  const filtered = useMemo(() => {
    let results = byCity;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      results = results.filter((e) => e.category === selectedCategory);
    }

    if (showFree) {
      results = results.filter((e) => e.isFree);
    }

    return results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [byCity, search, selectedCategory, showFree]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Community Events</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="w-4 h-4 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Events in <span className="font-semibold text-[#1B4332]">{selectedCity}, {selectedState}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search events in ${selectedCity}...`}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] text-gray-800 bg-gray-50"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-wrap gap-2 flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                  selectedCategory === cat ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <div
              onClick={() => setShowFree(!showFree)}
              className={`relative w-10 h-5 rounded-full transition-colors ${showFree ? 'bg-[#52B788]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showFree ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-600">Free Only</span>
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} {filtered.length === 1 ? 'event' : 'events'} in {selectedCity}
      </p>

      {byCity.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No events in this city"
          description={`There are no events listed in ${selectedCity} yet. Try selecting a different city from the location selector above.`}
          city={`${selectedCity}, ${selectedState}`}
          actionLabel="Change Location"
          onAction={() => {}}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matching events"
          description={`No events in ${selectedCity} match your current filters.`}
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setSelectedCategory('All'); setShowFree(false); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSave={() => toggleSaved('events', event.id)}
              isSaved={isSaved('events', event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
