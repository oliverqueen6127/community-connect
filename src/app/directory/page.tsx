'use client';

import React, { useState, useMemo } from 'react';
import { BUSINESSES } from '@/lib/data';
import BusinessCard from '@/components/cards/BusinessCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';

const CATEGORIES = ['All', 'halal', 'restaurant', 'mosque', 'grocery', 'school', 'healthcare', 'retail', 'services'];

export default function DirectoryPage() {
  const { toggleSaved, isSaved, selectedCity, selectedState } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'reviews'>('rating');
  const [showOpen, setShowOpen] = useState(false);

  // Step 1: strict city filter
  const byCity = useMemo(
    () => BUSINESSES.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase()),
    [selectedCity]
  );

  // Step 2: apply user filters within that city
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Business Directory</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="w-4 h-4 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Showing businesses in <span className="font-semibold text-[#1B4332]">{selectedCity}, {selectedState}</span>
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
            placeholder={`Search in ${selectedCity}...`}
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

          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setShowOpen(!showOpen)}
                className={`relative w-10 h-5 rounded-full transition-colors ${showOpen ? 'bg-[#52B788]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-600">Open Now</span>
            </label>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#52B788] bg-white text-gray-700"
            >
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviewed</option>
              <option value="name">A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} {filtered.length === 1 ? 'business' : 'businesses'} in {selectedCity}
      </p>

      {byCity.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No businesses in this city"
          description={`There are no businesses listed in ${selectedCity} yet. Try selecting a different city from the location selector above.`}
          city={`${selectedCity}, ${selectedState}`}
          actionLabel="Change Location"
          onAction={() => document.querySelector<HTMLButtonElement>('[data-city-selector]')?.click()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matches found"
          description={`No businesses in ${selectedCity} match your current filters. Try adjusting your search or category.`}
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setSelectedCategory('All'); setShowOpen(false); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
