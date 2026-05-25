'use client';

import React, { useState, useMemo } from 'react';
import { BUSINESSES } from '@/lib/data';
import BusinessCard from '@/components/cards/BusinessCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';
import { useListings } from '@/lib/listings-context';
import { Business } from '@/lib/types';

const CATEGORIES = ['All', 'halal', 'restaurant', 'mosque', 'grocery', 'school', 'healthcare', 'retail', 'services'];

export default function DirectoryPage() {
  const { toggleSaved, isSaved, selectedCity, selectedState } = useApp();
  const { activeListings } = useListings();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'reviews'>('rating');
  const [showOpen, setShowOpen] = useState(false);

  const userBusinesses = useMemo(
    () => activeListings.filter((l) => l.type === 'business').map((l) => l.data as Business),
    [activeListings]
  );

  const allBusinesses = useMemo(
    () => {
      const staticIds = new Set(BUSINESSES.map((b) => b.id));
      const newOnes = userBusinesses.filter((b) => !staticIds.has(b.id));
      return [...BUSINESSES, ...newOnes];
    },
    [userBusinesses]
  );

  const byCity = useMemo(
    () => allBusinesses.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase()),
    [allBusinesses, selectedCity]
  );

  const filtered = useMemo(() => {
    let results = byCity;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      results = results.filter(
        (b) => b.category === selectedCategory || b.tags.includes(selectedCategory)
      );
    }

    if (showOpen) {
      results = results.filter((b) => b.isOpen);
    }

    return [...results].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return a.name.localeCompare(b.name);
    });
  }, [byCity, search, selectedCategory, sortBy, showOpen]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1">Business Directory</h1>
        <div className="flex items-center gap-1.5 text-sm text-white/40">
          <svg className="w-4 h-4 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Showing businesses in <span className="font-semibold text-[#00E38C] ml-1">{selectedCity}, {selectedState}</span>
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
            placeholder={`Search in ${selectedCity}...`}
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
                  selectedCategory === cat
                    ? 'text-[#050816]'
                    : 'glass border border-white/10 text-white/40 hover:text-white hover:border-white/20'
                }`}
                style={selectedCategory === cat ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setShowOpen(!showOpen)}
                className={`relative w-10 h-5 rounded-full transition-colors ${showOpen ? 'bg-[#00E38C]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-white/40">Open Now</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm glass border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none text-white/60 bg-transparent"
            >
              <option value="rating" className="bg-[#050816]">Top Rated</option>
              <option value="reviews" className="bg-[#050816]">Most Reviewed</option>
              <option value="name" className="bg-[#050816]">A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/30 mb-4">
        {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'} in {selectedCity}
      </p>

      {byCity.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No businesses in this city"
          description={`There are no businesses listed in ${selectedCity} yet. Try selecting a different city.`}
          city={`${selectedCity}, ${selectedState}`}
          actionLabel="Change Location"
          onAction={() => document.querySelector<HTMLButtonElement>('[data-city-selector]')?.click()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matches found"
          description={`No businesses in ${selectedCity} match your current filters.`}
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setSelectedCategory('All'); setShowOpen(false); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onSave={() => toggleSaved('businesses', business.id)}
              isSaved={isSaved('businesses', business.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
