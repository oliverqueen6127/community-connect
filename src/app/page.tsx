'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import HomeAIChat from '@/components/chat/HomeAIChat';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import EmptyState from '@/components/ui/EmptyState';
import { BUSINESSES, EVENTS, US_CITIES } from '@/lib/data';
import { useApp } from '@/lib/context';

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="text-center glass-card rounded-2xl px-4 py-5">
      <div className="text-2xl md:text-3xl font-black gradient-text">{value}</div>
      <div className="text-white/35 text-xs font-medium mt-1">{icon} {label}</div>
    </div>
  );
}

export default function HomePage() {
  const { selectedCity, selectedState, setSelectedCity, setSelectedState } = useApp();

  const featuredBusinesses = useMemo(
    () => BUSINESSES.filter((b) => b.city.toLowerCase() === selectedCity.toLowerCase()).slice(0, 6),
    [selectedCity]
  );

  const upcomingEvents = useMemo(
    () => EVENTS.filter((e) => e.city.toLowerCase() === selectedCity.toLowerCase()).slice(0, 4),
    [selectedCity]
  );

  return (
    <div className="min-h-screen">

      {/* ═══════════════════════════════════════════
          HERO — compact, immediately below header
          ═══════════════════════════════════════════ */}
      <section className="relative pt-5 md:pt-7 pb-3 px-4 overflow-hidden">

        {/* Aurora glow layers behind the hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main green orb — top center */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,227,140,0.13) 0%, rgba(0,194,255,0.07) 45%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          {/* Blue accent — right */}
          <div
            className="absolute top-0 right-0 w-[450px] h-[350px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,194,255,0.09) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          {/* Teal accent — left */}
          <div
            className="absolute top-10 -left-20 w-[350px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(77,255,184,0.07) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        {/* Hero text — centered, tight */}
        <div className="max-w-4xl mx-auto text-center relative" style={{ animation: 'slideUp 0.5s ease' }}>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-1.5 text-white/55 text-xs mb-4 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E38C] animate-pulse" style={{ boxShadow: '0 0 6px rgba(0,227,140,0.9)' }} />
            AI-Powered Community Discovery
          </div>

          {/* H1 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3">
            Find Your Community
            <span className="block gradient-text">With AI</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/45 text-sm md:text-base max-w-xl mx-auto mb-4">
            Discover halal restaurants, mosques, housing, jobs, and events near you.
            Just ask — our AI does the rest.
          </p>

          {/* Location badge */}
          <div className="inline-flex items-center gap-2 glass border border-white/10 rounded-full px-4 py-2 text-white/55 text-sm font-medium">
            <svg className="w-3.5 h-3.5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Searching in
            <span className="font-black text-white">{selectedCity}, {selectedState}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          AI SEARCH — full width, no gap from hero
          ═══════════════════════════════════════════ */}
      <section className="relative z-10 px-4 pb-7">
        {/* Subtle glow under the input */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[180px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,227,140,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
        <div className="max-w-[1200px] mx-auto relative">
          <HomeAIChat />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS
          ═══════════════════════════════════════════ */}
      <section className="px-4 pb-7" style={{ animation: 'slideUp 0.9s ease' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <StatCard value="500+" label="Businesses" icon="🏪" />
          <StatCard value="200+" label="Events" icon="🎉" />
          <StatCard value="1,000+" label="Listings" icon="🏠" />
          <StatCard value="50+" label="Cities" icon="🌎" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          QUICK ACCESS CHIPS
          ═══════════════════════════════════════════ */}
      <section className="px-4 pb-10" style={{ animation: 'slideUp 1s ease' }}>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { href: '/directory', label: '🍽️ Restaurants' },
            { href: '/directory', label: '🕌 Mosques' },
            { href: '/jobs', label: '💼 Jobs' },
            { href: '/housing', label: '🏠 Housing' },
            { href: '/events', label: '🎉 Events' },
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

      {/* ═══════════════════════════════════════════
          FEATURED BUSINESSES
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Featured Businesses</h2>
            <p className="text-white/40 text-sm mt-1">
              Top-rated in <span className="font-semibold text-[#00E38C]">{selectedCity}</span>
            </p>
          </div>
          <Link href="/directory" className="flex items-center gap-1 text-sm font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {featuredBusinesses.length === 0 ? (
          <EmptyState
            icon="🏪"
            title="No businesses found"
            description={`There are no businesses listed in ${selectedCity} yet.`}
            city={selectedCity}
            actionLabel="Change Location"
            onAction={() => {
              const next = US_CITIES.find((c) => c.city !== selectedCity);
              if (next) { setSelectedCity(next.city); setSelectedState(next.state); }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          UPCOMING EVENTS
          ═══════════════════════════════════════════ */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">Upcoming Events</h2>
              <p className="text-white/40 text-sm mt-1">
                Community events in <span className="font-semibold text-[#00E38C]">{selectedCity}</span>
              </p>
            </div>
            <Link href="/events" className="flex items-center gap-1 text-sm font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No events found"
              description={`No upcoming events in ${selectedCity}.`}
              city={selectedCity}
              actionLabel="Browse All Events"
              onAction={() => {}}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {upcomingEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          POPULAR CITIES
          ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Explore by City</h2>
          <p className="text-white/40">Community Connect is available across the United States</p>
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

      {/* ═══════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════ */}
      <section className="py-14 px-4">
        <div
          className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-10 border border-white/8"
          style={{ boxShadow: '0 0 60px rgba(0,227,140,0.06)' }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">List Your Business for Free</h2>
          <p className="text-white/50 text-lg mb-8">
            Join thousands of community businesses and reach more customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 font-bold rounded-2xl text-[#050816] text-base transition-all hover:shadow-[0_0_25px_rgba(0,227,140,0.4)] hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
            >
              Get Started Free
            </Link>
            <Link
              href="/directory"
              className="px-8 py-4 glass border border-white/15 text-white font-bold rounded-2xl hover:border-[#00E38C]/40 transition-all duration-300 text-base"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
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
              { title: 'Explore', links: [{ label: 'Directory', href: '/directory' }, { label: 'Events', href: '/events' }, { label: 'Housing', href: '/housing' }, { label: 'Jobs', href: '/jobs' }] },
              { title: 'Account', links: [{ label: 'Sign In', href: '/auth/login' }, { label: 'Sign Up', href: '/auth/register' }, { label: 'Profile', href: '/profile' }] },
              { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-white/80 mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
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
            © {new Date().getFullYear()} Community Connect AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
