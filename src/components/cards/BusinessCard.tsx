'use client';

import React, { useState } from 'react';
import { Business } from '@/lib/types';
import ContactModal from '@/components/ui/ContactModal';
import { useLanguage } from '@/lib/language-context';

interface BusinessCardProps {
  business: Business;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function BusinessCard({ business, onSave, isSaved = false }: BusinessCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const { t } = useLanguage();

  const priceLabel = '$'.repeat(business.priceLevel);

  return (
    <>
      <div className="group glass-card rounded-2xl overflow-hidden flex flex-col border border-white/8 hover:border-[#00E38C]/30 transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-white/5">
          {!imgError ? (
            <img
              src={business.image}
              alt={business.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.1), rgba(0,194,255,0.1))' }}>
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Open badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${business.isOpen ? 'badge-open' : 'badge-closed'}`}>
              ● {business.isOpen ? t('common', 'open') : t('common', 'closed')}
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isSaved
                ? 'bg-red-500/90 text-white'
                : 'bg-black/40 text-white/60 hover:bg-black/60 hover:text-red-400'
            }`}
          >
            <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-1">{business.name}</h3>
            <span className="text-white/30 text-sm flex-shrink-0">{priceLabel}</span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${star <= Math.round(business.rating) ? 'text-yellow-400' : 'text-white/10'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-semibold text-white/60">{business.rating}</span>
            <span className="text-xs text-white/30">({business.reviewCount.toLocaleString()})</span>
          </div>

          <p className="text-xs text-white/30 mb-3 flex items-center gap-1 line-clamp-1">
            <svg className="w-3 h-3 flex-shrink-0 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {business.address}, {business.city}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3 flex-1">
            {business.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/8">{tag}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            <a
              href={`tel:${business.phone}`}
              className="flex-1 text-center py-2 text-xs font-semibold border border-white/15 rounded-xl text-white/60 hover:text-[#00E38C] hover:border-[#00E38C]/40 transition-all"
            >
              {t('common', 'call')}
            </a>
            <button
              onClick={() => setShowContact(true)}
              className="flex-1 py-2 text-xs font-bold rounded-xl text-[#050816] transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
            >
              {t('common', 'contact')}
            </button>
          </div>
        </div>
      </div>

      {showContact && (
        <ContactModal
          listingId={business.id}
          listingTitle={business.name}
          listingType="business"
          onClose={() => setShowContact(false)}
        />
      )}
    </>
  );
}
