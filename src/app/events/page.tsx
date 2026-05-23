'use client';

import React, { useState, useMemo } from 'react';
import { EVENTS } from '@/lib/data';
import EventCard from '@/components/cards/EventCard';
import { useApp } from '@/lib/context';

const CATEGORIES = ['All', 'fundraiser', 'religious', 'food', 'education', 'community', 'sports', 'business'];

export default function EventsPage() {
  const { toggleSaved, isSaved } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFree, setShowFree] = useState(false);

  const filtered = useMemo(() => {
    let results = EVENTS;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
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
  }, [search, selectedCategory, showFree]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Community Events</h1>
        <p className="text-gray-500">Discover upcoming events in your community</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, organizers, locations..."
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

      <p className="text-sm text-gray-500 mb-4">{filtered.length} events found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No events found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
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
