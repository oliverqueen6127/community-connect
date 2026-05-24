'use client';

import React, { useState } from 'react';
import { Housing } from '@/lib/types';
import ContactModal from '@/components/ui/ContactModal';
import { useLanguage } from '@/lib/language-context';

interface HousingCardProps {
  housing: Housing;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function HousingCard({ housing, onSave, isSaved = false }: HousingCardProps) {
  const [imgError, setImgError] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const { t } = useLanguage();

  const propertyTypeEmoji: Record<string, string> = {
    apartment: '🏢', house: '🏠', condo: '🏙️', townhouse: '🏘️', studio: '🛋️',
  };

  return (
    <>
      <div className="group glass-card rounded-2xl overflow-hidden flex flex-col border border-white/8 hover:border-[#00C2FF]/30">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-white/5">
          {!imgError && housing.images.length > 0 ? (
            <img
              src={housing.images[currentImg]}
              alt={housing.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,194,255,0.1), rgba(0,227,140,0.08))' }}>
              <span className="text-5xl">{propertyTypeEmoji[housing.propertyType] || '🏠'}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {housing.images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
              {housing.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-[#00E38C] w-4' : 'bg-white/40 w-1.5'}`}
                />
              ))}
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              housing.listingType === 'rent'
                ? 'bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/30'
                : 'bg-[#00E38C]/15 text-[#00E38C] border border-[#00E38C]/30'
            }`}>
              {housing.listingType === 'rent' ? t('common', 'forRent') : t('common', 'forSale')}
            </span>
          </div>

          <button
            onClick={onSave}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isSaved ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white/60 hover:text-red-400'
            }`}
          >
            <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1">{housing.title}</h3>

          <div className="text-xl font-black gradient-text mb-2">
            ${housing.price.toLocaleString()}
            {housing.listingType === 'rent' && <span className="text-sm font-medium text-white/30">/mo</span>}
          </div>

          <div className="flex items-center gap-3 text-xs text-white/30 mb-3 flex-wrap">
            {housing.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#00C2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {housing.bedrooms} bd
              </span>
            )}
            <span>{housing.bathrooms} ba</span>
            <span>{housing.sqft.toLocaleString()} sqft</span>
          </div>

          <p className="text-xs text-white/30 mb-3 flex items-center gap-1 line-clamp-1">
            <svg className="w-3 h-3 text-[#00E38C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {housing.city}, {housing.state} {housing.zip}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {housing.petFriendly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20">Pet Friendly</span>}
            {housing.parking && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20">Parking</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/8">{housing.propertyType}</span>
          </div>

          <button
            onClick={() => setShowContact(true)}
            className="mt-auto w-full py-2.5 text-xs font-bold rounded-xl text-[#050816] transition-all hover:shadow-[0_0_15px_rgba(0,194,255,0.3)]"
            style={{ background: 'linear-gradient(135deg, #00C2FF, #00E38C)' }}
          >
            {t('messages', 'contactOwner')}
          </button>
        </div>
      </div>

      {showContact && (
        <ContactModal
          listingId={housing.id}
          listingTitle={housing.title}
          listingType="housing"
          ownerName={housing.contactName}
          ownerEmail={housing.contactEmail}
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
}
