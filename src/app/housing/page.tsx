'use client';

import React, { useState, useMemo } from 'react';
import { HOUSING } from '@/lib/data';
import HousingCard from '@/components/cards/HousingCard';
import EmptyState from '@/components/ui/EmptyState';
import { useApp } from '@/lib/context';
import { useListings } from '@/lib/listings-context';
import { Housing } from '@/lib/types';

export default function HousingPage() {
  const { toggleSaved, isSaved, selectedCity, selectedState } = useApp();
  const { activeListings } = useListings();
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState<'all' | 'rent' | 'sale'>('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [minBeds, setMinBeds] = useState('0');
  const [petFriendly, setPetFriendly] = useState(false);

  const userHousing = useMemo(
    () => activeListings.filter((l) => l.type === 'housing').map((l) => l.data as Housing),
    [activeListings]
  );

  const allHousing = useMemo(
    () => {
      const staticIds = new Set(HOUSING.map((h) => h.id));
      const newOnes = userHousing.filter((h) => !staticIds.has(h.id));
      return [...HOUSING, ...newOnes];
    },
    [userHousing]
  );

  const byCity = useMemo(
    () => allHousing.filter((h) => h.city.toLowerCase() === selectedCity.toLowerCase()),
    [allHousing, selectedCity]
  );

  const filtered = useMemo(() => {
    let results = byCity;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((h) => h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q));
    }
    if (listingType !== 'all') results = results.filter((h) => h.listingType === listingType);
    if (maxPrice) results = results.filter((h) => h.price <= parseInt(maxPrice));
    if (minBeds !== '0') results = results.filter((h) => h.bedrooms >= parseInt(minBeds));
    if (petFriendly) results = results.filter((h) => h.petFriendly);
    return results.sort((a, b) => a.price - b.price);
  }, [byCity, search, listingType, maxPrice, minBeds, petFriendly]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1">Housing Listings</h1>
        <div className="flex items-center gap-1.5 text-sm text-white/40">
          <svg className="w-4 h-4 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Listings in <span className="font-semibold text-[#00E38C] ml-1">{selectedCity}, {selectedState}</span>
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
            placeholder={`Search listings in ${selectedCity}...`}
            className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {(['all', 'rent', 'sale'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setListingType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  listingType === type ? 'text-[#050816]' : 'glass border border-white/10 text-white/40 hover:text-white'
                }`}
                style={listingType === type ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
              >
                {type === 'all' ? 'All Types' : `For ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
            ))}
          </div>

          <select
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            className="text-sm glass border border-white/10 rounded-xl px-3 py-2 focus:outline-none text-white/60 bg-transparent"
          >
            <option value="0" className="bg-[#050816]">Any Bedrooms</option>
            <option value="1" className="bg-[#050816]">1+ Beds</option>
            <option value="2" className="bg-[#050816]">2+ Beds</option>
            <option value="3" className="bg-[#050816]">3+ Beds</option>
            <option value="4" className="bg-[#050816]">4+ Beds</option>
          </select>

          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            className="glass-input text-sm rounded-xl px-3 py-2 w-32"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setPetFriendly(!petFriendly)} className={`relative w-10 h-5 rounded-full transition-colors ${petFriendly ? 'bg-[#00E38C]' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${petFriendly ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/40">Pet Friendly</span>
          </label>
        </div>
      </div>

      <p className="text-sm text-white/30 mb-4">{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'} in {selectedCity}</p>

      {byCity.length === 0 ? (
        <EmptyState icon="🏠" title="No listings in this city" description={`No housing in ${selectedCity} yet.`} city={`${selectedCity}, ${selectedState}`} actionLabel="Change Location" onAction={() => {}} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matches found" description={`No listings match your filters.`} actionLabel="Clear Filters" onAction={() => { setSearch(''); setListingType('all'); setMaxPrice(''); setMinBeds('0'); setPetFriendly(false); }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((housing) => (
            <HousingCard key={housing.id} housing={housing} onSave={() => toggleSaved('housing', housing.id)} isSaved={isSaved('housing', housing.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
