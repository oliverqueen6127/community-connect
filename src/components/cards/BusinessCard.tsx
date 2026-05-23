'use client';

import React, { useState } from 'react';
import { Business } from '@/lib/types';
import Badge from '@/components/ui/Badge';
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
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {!imgError ? (
            <img
              src={business.image}
              alt={business.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B4332] to-[#52B788]">
              <span className="text-white text-4xl">🍽️</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={business.isOpen ? 'green' : 'red'}>
              {business.isOpen ? `● ${t('common', 'open')}` : `● ${t('common', 'closed')}`}
            </Badge>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(); }}
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
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1">{business.name}</h3>
            <span className="text-gray-400 text-sm flex-shrink-0">{priceLabel}</span>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(business.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">{business.rating}</span>
            <span className="text-xs text-gray-400">({business.reviewCount.toLocaleString()})</span>
          </div>

          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="line-clamp-1">{business.address}, {business.city}, {business.state}</span>
          </p>

          <div className="flex flex-wrap gap-1 mb-3 flex-1">
            {business.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="gray" size="sm">{tag}</Badge>
            ))}
          </div>

          <div className="flex gap-2 mt-auto">
            <a
              href={`tel:${business.phone}`}
              className="flex-1 text-center py-2 text-sm font-medium text-[#1B4332] border border-[#1B4332] rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors"
            >
              {t('common', 'call')}
            </a>
            <button
              onClick={() => setShowContact(true)}
              className="flex-1 py-2 text-sm font-medium bg-[#1B4332] text-white rounded-xl hover:bg-[#0f2d21] transition-colors"
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
