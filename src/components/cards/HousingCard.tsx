'use client';

import React, { useState } from 'react';
import { Housing } from '@/lib/types';
import Badge from '@/components/ui/Badge';

interface HousingCardProps {
  housing: Housing;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function HousingCard({ housing, onSave, isSaved = false }: HousingCardProps) {
  const [imgError, setImgError] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  const propertyTypeEmoji: Record<string, string> = {
    apartment: '🏢',
    house: '🏠',
    condo: '🏙️',
    townhouse: '🏘️',
    studio: '🛋️',
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {!imgError && housing.images.length > 0 ? (
          <img
            src={housing.images[currentImg]}
            alt={housing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600">
            <span className="text-white text-5xl">{propertyTypeEmoji[housing.propertyType] || '🏠'}</span>
          </div>
        )}

        {housing.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {housing.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImg(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white w-4' : 'bg-white/60'}`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={housing.listingType === 'rent' ? 'blue' : 'green'}>
            For {housing.listingType === 'rent' ? 'Rent' : 'Sale'}
          </Badge>
        </div>
        <button
          onClick={onSave}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
            isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
          }`}
        >
          <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{housing.title}</h3>
        </div>

        <div className="text-2xl font-black text-[#1B4332] mb-2">
          ${housing.price.toLocaleString()}
          {housing.listingType === 'rent' && <span className="text-sm font-medium text-gray-500">/mo</span>}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 flex-wrap">
          {housing.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {housing.bedrooms} bd
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {housing.bathrooms} ba
          </span>
          <span>{housing.sqft.toLocaleString()} sqft</span>
        </div>

        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="line-clamp-1">{housing.city}, {housing.state} {housing.zip}</span>
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {housing.petFriendly && <Badge variant="green" size="sm">Pet Friendly</Badge>}
          {housing.parking && <Badge variant="blue" size="sm">Parking</Badge>}
          <Badge variant="gray" size="sm">{housing.propertyType}</Badge>
        </div>

        <button className="mt-auto w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white rounded-xl hover:opacity-90 transition-opacity">
          Contact Owner
        </button>
      </div>
    </div>
  );
}
