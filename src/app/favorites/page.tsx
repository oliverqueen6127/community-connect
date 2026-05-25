'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useFavorites } from '@/lib/favorites-context';
import { useListings } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import { Business, Event, Housing, Job } from '@/lib/types';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import HousingCard from '@/components/cards/HousingCard';
import JobCard from '@/components/cards/JobCard';

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useApp();
  const { isSaved, toggleSaved, favoritesCount, isLoading: favLoading } = useFavorites();
  const { activeListings } = useListings();
  const { t } = useLanguage();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/favorites');
  }, [user, authLoading, router]);

  // Combine static data with user-created listings (same pattern as directory/events/etc.)
  const allBusinesses = useMemo(() => {
    const userBiz = activeListings.filter((l) => l.type === 'business').map((l) => l.data as Business);
    const staticIds = new Set(BUSINESSES.map((b) => b.id));
    return [...BUSINESSES, ...userBiz.filter((b) => !staticIds.has(b.id))];
  }, [activeListings]);

  const allEvents = useMemo(() => {
    const userEvt = activeListings.filter((l) => l.type === 'event').map((l) => l.data as Event);
    const staticIds = new Set(EVENTS.map((e) => e.id));
    return [...EVENTS, ...userEvt.filter((e) => !staticIds.has(e.id))];
  }, [activeListings]);

  const allHousing = useMemo(() => {
    const userHsg = activeListings.filter((l) => l.type === 'housing').map((l) => l.data as Housing);
    const staticIds = new Set(HOUSING.map((h) => h.id));
    return [...HOUSING, ...userHsg.filter((h) => !staticIds.has(h.id))];
  }, [activeListings]);

  const allJobs = useMemo(() => {
    const userJob = activeListings.filter((l) => l.type === 'job').map((l) => l.data as Job);
    const staticIds = new Set(JOBS.map((j) => j.id));
    return [...JOBS, ...userJob.filter((j) => !staticIds.has(j.id))];
  }, [activeListings]);

  // Filter by saved state
  const savedBusinesses = useMemo(() => allBusinesses.filter((b) => isSaved('businesses', b.id)), [allBusinesses, isSaved]);
  const savedEvents     = useMemo(() => allEvents.filter((e)    => isSaved('events',     e.id)), [allEvents,     isSaved]);
  const savedHousing    = useMemo(() => allHousing.filter((h)   => isSaved('housing',    h.id)), [allHousing,    isSaved]);
  const savedJobs       = useMemo(() => allJobs.filter((j)       => isSaved('jobs',       j.id)), [allJobs,       isSaved]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  if (favLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t('favorites', 'title')}</h1>
          <p className="text-white/40 mt-1">Loading your favorites…</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  const total = savedBusinesses.length + savedEvents.length + savedHousing.length + savedJobs.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{t('favorites', 'title')}</h1>
        <p className="text-white/40 mt-1">
          {favoritesCount} saved · {total} displayed
        </p>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-6xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>❤️</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('favorites', 'noFavorites')}</h3>
          <p className="text-white/30 mb-6 max-w-xs mx-auto">{t('favorites', 'noFavoritesDesc')}</p>
          <Link
            href="/"
            className="px-6 py-3 text-[#050816] font-bold rounded-2xl inline-block hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] transition-all"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
          >
            {t('favorites', 'browse')}
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {savedBusinesses.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🏪 Businesses
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20">
                  {savedBusinesses.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedBusinesses.map((b) => (
                  <BusinessCard key={b.id} business={b} isSaved onSave={() => toggleSaved('businesses', b.id)} />
                ))}
              </div>
            </section>
          )}

          {savedEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🎉 {t('nav', 'events')}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20">
                  {savedEvents.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedEvents.map((e) => (
                  <EventCard key={e.id} event={e} isSaved onSave={() => toggleSaved('events', e.id)} />
                ))}
              </div>
            </section>
          )}

          {savedHousing.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                🏠 {t('nav', 'housing')}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                  {savedHousing.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedHousing.map((h) => (
                  <HousingCard key={h.id} housing={h} isSaved onSave={() => toggleSaved('housing', h.id)} />
                ))}
              </div>
            </section>
          )}

          {savedJobs.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                💼 {t('nav', 'jobs')}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {savedJobs.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
