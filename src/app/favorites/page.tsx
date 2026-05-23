'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import HousingCard from '@/components/cards/HousingCard';
import JobCard from '@/components/cards/JobCard';

export default function FavoritesPage() {
  const { user, isLoading, isSaved, toggleSaved } = useApp();
  const { t } = useLanguage();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login?redirect=/favorites');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] animate-pulse" />
      </div>
    );
  }

  const savedBusinesses = BUSINESSES.filter((b) => isSaved('businesses', b.id));
  const savedEvents = EVENTS.filter((e) => isSaved('events', e.id));
  const savedHousing = HOUSING.filter((h) => isSaved('housing', h.id));
  const savedJobs = JOBS.filter((j) => isSaved('jobs', j.id));
  const total = savedBusinesses.length + savedEvents.length + savedHousing.length + savedJobs.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">{t('favorites', 'title')}</h1>
        <p className="text-gray-500 mt-1">{total} {total === 1 ? 'item' : 'items'} saved</p>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">{t('favorites', 'noFavorites')}</h3>
          <p className="text-gray-400 mb-6 max-w-xs mx-auto">{t('favorites', 'noFavoritesDesc')}</p>
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity inline-block">
            {t('favorites', 'browse')}
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {savedBusinesses.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                🏪 Businesses
                <span className="text-sm font-semibold bg-[#1B4332]/10 text-[#1B4332] px-2.5 py-0.5 rounded-full">{savedBusinesses.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBusinesses.map((b) => (
                  <BusinessCard key={b.id} business={b} isSaved onSave={() => toggleSaved('businesses', b.id)} />
                ))}
              </div>
            </section>
          )}

          {savedEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                🎉 {t('nav', 'events')}
                <span className="text-sm font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">{savedEvents.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEvents.map((e) => (
                  <EventCard key={e.id} event={e} isSaved onSave={() => toggleSaved('events', e.id)} />
                ))}
              </div>
            </section>
          )}

          {savedHousing.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                🏠 {t('nav', 'housing')}
                <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">{savedHousing.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedHousing.map((h) => (
                  <HousingCard key={h.id} housing={h} isSaved onSave={() => toggleSaved('housing', h.id)} />
                ))}
              </div>
            </section>
          )}

          {savedJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                💼 {t('nav', 'jobs')}
                <span className="text-sm font-semibold bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full">{savedJobs.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.map((j) => (
                  <JobCard key={j.id} job={j} isSaved onSave={() => toggleSaved('jobs', j.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
