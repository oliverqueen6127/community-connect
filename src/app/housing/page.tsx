'use client';

import React, { useState, useMemo } from 'react';
import { HOUSING } from '@/lib/data';
import HousingCard from '@/components/cards/HousingCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';

export default function HousingPage() {
  const { toggleSaved, isSaved, selectedCity, selectedState } = useApp();
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState<'all' | 'rent' | 'sale'>('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState('0');
  const [petFriendly, setPetFriendly] = useState(false);

  // Strict city filter first
  const byCity = useMemo(
    () => HOUSING.filter((h) => h.city.toLowerCase() === selectedCity.toLowerCase()),
    [selectedCity]
  );

  const filtered = useMemo(() => {
    let results = byCity;

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q)
      );
    }

    if (listingType !== 'all') {
      results = results.filter((h) => h.listingType === listingType);
    }

    if (maxPrice) {
      results = results.filter((h) => h.price <= parseInt(maxPrice));
    }

    if (minBeds !== '0') {
      results = results.filter((h) => h.bedrooms >= parseInt(minBeds));
    }

    if (petFriendly) {
      results = results.filter((h) => h.petFriendly);
    }

    return results.sort((a, b) => a.price - b.price);
  }, [byCity, search, listingType, maxPrice, minBeds, petFriendly]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Housing Listings</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <svg className="w-4 h-4 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Listings in <span className="font-semibold text-[#1B4332]">{selectedCity}, {selectedState}</span>
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
            placeholder={`Search listings in ${selectedCity}...`}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] text-gray-800 bg-gray-50"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {(['all', 'rent', 'sale'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setListingType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  listingType === type ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Types' : `For ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
            ))}
          </div>

          <select
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#52B788] bg-white text-gray-700"
          >
            <option value="0">Any Bedrooms</option>
            <option value="1">1+ Beds</option>
            <option value="2">2+ Beds</option>
            <option value="3">3+ Beds</option>
            <option value="4">4+ Beds</option>
          </select>

          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 w-32 focus:outline-none focus:border-[#52B788] bg-white text-gray-700"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setPetFriendly(!petFriendly)}
              className={`relative w-10 h-5 rounded-full transition-colors ${petFriendly ? 'bg-[#52B788]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${petFriendly ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-600">Pet Friendly</span>
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'} in {selectedCity}
      </p>

      {byCity.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No listings in this city"
          description={`There are no housing listings in ${selectedCity} yet. Try selecting a different city.`}
          city={`${selectedCity}, ${selectedState}`}
          actionLabel="Change Location"
          onAction={() => {}}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matches found"
          description={`No listings in ${selectedCity} match your current filters.`}
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setListingType('all'); setMaxPrice(''); setMinBeds('0'); setPetFriendly(false); }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((housing) => (
            <HousingCard
              key={housing.id}
              housing={housing}
              onSave={() => toggleSaved('housing', housing.id)}
              isSaved={isSaved('housing', housing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
