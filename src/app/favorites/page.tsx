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
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const savedBusinesses = BUSINESSES.filter((b) => isSaved('businesses', b.id));
  const savedEvents = EVENTS.filter((e) => isSaved('events', e.id));
  const savedHousing = HOUSING.filter((h) => isSaved('housing', h.id));
  const savedJobs = JOBS.filter((j) => isSaved('jobs', j.id));
  const total = savedBusinesses.length + savedEvents.length + savedHousing.length + savedJobs.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{t('favorites', 'title')}</h1>
        <p className="text-white/40 mt-1">{total} {total === 1 ? 'item' : 'items'} saved</p>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/8">
          <div className="text-6xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>❤️</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('favorites', 'noFavorites')}</h3>
          <p className="text-white/30 mb-6 max-w-xs mx-auto">{t('favorites', 'noFavoritesDesc')}</p>
          <Link href="/" className="px-6 py-3 text-[#050816] font-bold rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] inline-block"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
            {t('favorites', 'browse')}
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {savedBusinesses.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🏪 Businesses
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20">{savedBusinesses.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedBusinesses.map((b) => <BusinessCard key={b.id} business={b} isSaved onSave={() => toggleSaved('businesses', b.id)} />)}
              </div>
            </section>
          )}
          {savedEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🎉 {t('nav', 'events')}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20">{savedEvents.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedEvents.map((e) => <EventCard key={e.id} event={e} isSaved onSave={() => toggleSaved('events', e.id)} />)}
              </div>
            </section>
          )}
          {savedHousing.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🏠 {t('nav', 'housing')}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">{savedHousing.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedHousing.map((h) => <HousingCard key={h.id} housing={h} isSaved onSave={() => toggleSaved('housing', h.id)} />)}
              </div>
            </section>
          )}
          {savedJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                💼 {t('nav', 'jobs')}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{savedJobs.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedJobs.map((j) => <JobCard key={j.id} job={j} isSaved onSave={() => toggleSaved('jobs', j.id)} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
