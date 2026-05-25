'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import HomeAIChat from '@/components/chat/HomeAIChat';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import EmptyState from '@/components/ui/EmptyState';
import { BUSINESSES, EVENTS, US_CITIES } from '@/lib/data';
import { useApp } from '@/lib/context';
import { useFavorites } from '@/lib/favorites-context';
import { useLanguage } from '@/lib/language-context';
import LocationPicker from '@/components/ui/LocationPicker';
import { useListings } from '@/lib/listings-context';
import { Business, Event } from '@/lib/types';

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="text-center glass-card rounded-2xl px-4 py-5">
      <div className="text-2xl md:text-3xl font-black gradient-text">{value}</div>
      <div className="text-white/35 text-xs font-medium mt-1">{icon} {label}</div>
    </div>
  );
}

const TYPE_EMOJI: Record<string, string> = { business: '🏪', event: '🎉', housing: '🏠', job: '💼' };
const TYPE_HREF: Record<string, string> = { business: '/directory', event: '/events', housing: '/housing', job: '/jobs' };

export default function HomePage() {
  const { selectedCity, setSelectedCity, setSelectedState } = useApp();
  const { toggleSaved, isSaved } = useFavorites();
  const { t } = useLanguage();
  const { activeListings } = useListings();

  const userBusinesses = useMemo(
    () => activeListings.filter((l) => l.type === 'business').map((l) => l.data as Business),
    [activeListings]
  );

  const userEvents = useMemo(
    () => activeListings.filter((l) => l.type === 'event').map((l) => l.data as Event),
    [activeListings]
  );

  const allBusinesses = useMemo(() => {
    const staticIds = new Set(BUSINESSES.map((b) => b.id));
    return [...BUSINESSES, ...userBusinesses.filter((b) => !staticIds.has(b.id))];
  }, [userBusinesses]);

  const allEvents = useMemo(() => {
    const staticIds = new Set(EVENTS.map((e) => e.id));
    return [...EVENTS, ...userEvents.filter((e) => !staticIds.has(e.id))];
  }, [userEvents]);

  const featuredBusinesses = useMemo(
    () => allBusinesses.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase()).slice(0, 6),
    [allBusinesses, selectedCity]
  );

  const upcomingEvents = useMemo(
    () => allEvents.filter((e) => e.city.toLowerCase() === selectedCity.toLowerCase()).slice(0, 4),
    [allEvents, selectedCity]
  );

  const recentlyAdded = useMemo(
    () => [...activeListings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6),
    [activeListings]
  );

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="relative pt-5 md:pt-7 pb-3 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(0,227,140,0.13) 0%, rgba(0,194,255,0.07) 45%, transparent 70%)', filter: 'blur(60px)' }}
          />
          <div
            className="absolute top-0 right-0 w-[450px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(0,194,255,0.09) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
          <div
            className="absolute top-10 -left-20 w-[350px] h-[300px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(77,255,184,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative" style={{ animation: 'slideUp 0.5s ease' }}>
          <div className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-1.5 text-white/55 text-xs mb-4 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E38C] animate-pulse" style={{ boxShadow: '0 0 6px rgba(0,227,140,0.9)' }} />
            {t('home', 'heroBadge')}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3">
            {t('home', 'heroTitle')}
            <span className="block gradient-text">{t('home', 'heroWith')}</span>
          </h1>

          <p className="text-white/45 text-sm md:text-base max-w-xl mx-auto mb-4">
            {t('home', 'heroSubtitle')}
          </p>

          <LocationPicker />
        </div>
      </section>

      {/* AI SEARCH */}
      <section className="relative z-10 px-4 pb-7">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[180px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,227,140,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
        <div className="max-w-[1200px] mx-auto relative">
          <HomeAIChat />
        </div>
      </section>

      {/* STATS */}
      <section className="px-4 pb-7" style={{ animation: 'slideUp 0.9s ease' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <StatCard value={t('home', 'stats500')} label={t('home', 'statsBusiness')} icon="🏪" />
          <StatCard value={t('home', 'stats200')} label={t('home', 'statsEvents')} icon="🎉" />
          <StatCard value={t('home', 'stats1000')} label={t('home', 'statsListings')} icon="🏠" />
          <StatCard value={t('home', 'stats50')} label={t('home', 'statsCities')} icon="🌎" />
        </div>
      </section>

      {/* QUICK ACCESS CHIPS */}
      <section className="px-4 pb-10" style={{ animation: 'slideUp 1s ease' }}>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { href: '/directory', label: `🍽️ ${t('home', 'restaurants')}` },
            { href: '/directory', label: `🕌 ${t('home', 'mosques')}` },
            { href: '/jobs', label: `💼 ${t('home', 'jobs')}` },
            { href: '/housing', label: `🏠 ${t('home', 'housing')}` },
            { href: '/events', label: `🎉 ${t('home', 'events')}` },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 glass border border-white/10 hover:border-[#00E38C]/40 text-white/50 hover:text-white rounded-full text-sm font-medium transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,227,140,0.15)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED BUSINESSES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">{t('home', 'featuredBusinesses')}</h2>
            <p className="text-white/40 text-sm mt-1">
              {t('home', 'topRatedIn')} <span className="font-semibold text-[#00E38C]">{selectedCity}</span>
            </p>
          </div>
          <Link href="/directory" className="flex items-center gap-1 text-sm font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">
            {t('home', 'viewAll')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {featuredBusinesses.length === 0 ? (
          <EmptyState
            icon="🏪"
            title={t('home', 'noBusinesses')}
            description={`${t('home', 'noBusinessesDesc')} ${selectedCity}.`}
            city={selectedCity}
            actionLabel={t('home', 'changeLocation')}
            onAction={() => {
              const next = US_CITIES.find((c) => c.city !== selectedCity);
              if (next) { setSelectedCity(next.city); setSelectedState(next.state); }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredBusinesses.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                isSaved={isSaved('businesses', b.id)}
                onSave={() => {
                  console.log('HOME FAVORITE CLICK', { id: b.id, type: 'businesses', title: b.name });
                  toggleSaved('businesses', b.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* RECENTLY ADDED */}
      {recentlyAdded.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">Recently Added</h2>
              <p className="text-white/40 text-sm mt-1">
                New listings from the community
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentlyAdded.map((listing) => {
              const title = ('name' in listing.data ? listing.data.name as string : '') || ('title' in listing.data ? listing.data.title as string : '') || 'Untitled';
              const href = TYPE_HREF[listing.type] || '/directory';
              return (
                <Link key={listing.id} href={href} className="glass-card border border-white/8 hover:border-[#00E38C]/30 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.2)' }}>
                    {TYPE_EMOJI[listing.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate group-hover:text-[#00E38C] transition-colors">{title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{listing.data.city}, {listing.data.state}</p>
                    <p className="text-xs text-white/20 mt-0.5">
                      {new Date(listing.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20 capitalize flex-shrink-0">
                    {listing.type}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* UPCOMING EVENTS */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">{t('home', 'upcomingEvents')}</h2>
              <p className="text-white/40 text-sm mt-1">
                {t('home', 'communityEventsIn')} <span className="font-semibold text-[#00E38C]">{selectedCity}</span>
              </p>
            </div>
            <Link href="/events" className="flex items-center gap-1 text-sm font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">
              {t('home', 'viewAll')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon="📅"
              title={t('home', 'noEvents')}
              description={`${t('home', 'noEventsDesc')} ${selectedCity}.`}
              city={selectedCity}
              actionLabel={t('home', 'browseAllEvents')}
              onAction={() => {}}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {upcomingEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  isSaved={isSaved('events', e.id)}
                  onSave={() => {
                    console.log('HOME FAVORITE CLICK', { id: e.id, type: 'events', title: e.title });
                    toggleSaved('events', e.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* POPULAR CITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{t('home', 'exploreByCity')}</h2>
          <p className="text-white/40">{t('home', 'availableAcross')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {US_CITIES.slice(0, 10).map((c) => (
            <button
              key={`${c.city}-${c.state}`}
              onClick={() => { setSelectedCity(c.city); setSelectedState(c.state); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`group flex flex-col items-center justify-center py-5 px-3 rounded-2xl border transition-all duration-300 text-center ${
                selectedCity === c.city
                  ? 'border-[#00E38C]/50 bg-[#00E38C]/8'
                  : 'glass border-white/8 hover:border-[#00E38C]/30 hover:bg-[#00E38C]/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                selectedCity === c.city ? 'bg-[#00E38C]/20' : 'bg-white/5'
              }`}>
                <svg className={`w-5 h-5 ${selectedCity === c.city ? 'text-[#00E38C]' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <span className={`font-bold text-sm ${selectedCity === c.city ? 'text-[#00E38C]' : 'text-white/70'}`}>{c.city}</span>
              <span className={`text-xs ${selectedCity === c.city ? 'text-[#00E38C]/60' : 'text-white/30'}`}>{c.state}</span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4">
        <div
          className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-10 border border-white/8"
          style={{ boxShadow: '0 0 60px rgba(0,227,140,0.06)' }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{t('home', 'listBusiness')}</h2>
          <p className="text-white/50 text-lg mb-8">{t('home', 'listBusinessDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 font-bold rounded-2xl text-[#050816] text-base transition-all hover:shadow-[0_0_25px_rgba(0,227,140,0.4)] hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
            >
              {t('home', 'getStarted')}
            </Link>
            <Link
              href="/directory"
              className="px-8 py-4 glass border border-white/15 text-white font-bold rounded-2xl hover:border-[#00E38C]/40 transition-all duration-300 text-base"
            >
              {t('home', 'browseDirectory')}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="glass border-t border-white/8 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="font-black text-white text-xl mb-2">
                Community <span className="gradient-text">Connect AI</span>
              </div>
              <p className="text-white/30 text-sm">AI-powered community discovery for Muslim Americans and diverse communities.</p>
            </div>
            {[
              { title: t('home', 'explore'), links: [{ label: t('home', 'restaurants'), href: '/directory' }, { label: t('home', 'events'), href: '/events' }, { label: t('home', 'housing'), href: '/housing' }, { label: t('home', 'jobs'), href: '/jobs' }] },
              { title: t('nav', 'profile'), links: [{ label: t('auth', 'signIn'), href: '/auth/login' }, { label: t('auth', 'signUp'), href: '/auth/register' }, { label: t('nav', 'profile'), href: '/profile' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-white/80 mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-white/30 hover:text-[#00E38C] text-sm transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-6 text-center text-white/20 text-sm">
            © {new Date().getFullYear()} Community Connect AI. {t('home', 'copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
