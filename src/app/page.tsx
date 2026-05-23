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
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-black text-white">{value}</div>
      <div className="text-[#52B788] text-sm font-medium mt-1">{icon} {label}</div>
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
      {/* Hero */}
      <section className="hero-gradient py-16 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white/90 text-sm mb-6" style={{ animation: 'fadeIn 0.6s ease' }}>
            <span className="w-2 h-2 bg-[#52B788] rounded-full animate-pulse" />
            AI-Powered Community Discovery
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4" style={{ animation: 'slideUp 0.6s ease' }}>
            Find Your Community
            <span className="block text-[#52B788]">With AI Assistance</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-4" style={{ animation: 'slideUp 0.7s ease' }}>
            Discover halal restaurants, mosques, housing, jobs, and events near you. Just ask — our AI does the rest.
          </p>

          {/* Active location pill */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-2 text-white/95 text-sm mb-8 font-medium" style={{ animation: 'slideUp 0.75s ease' }}>
            <svg className="w-4 h-4 text-[#52B788]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Showing results for <span className="font-black text-white">{selectedCity}, {selectedState}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10" style={{ animation: 'slideUp 0.8s ease' }}>
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
                className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-2xl mx-auto" style={{ animation: 'slideUp 0.9s ease' }}>
            <StatCard value="500+" label="Businesses" icon="🏪" />
            <StatCard value="200+" label="Events" icon="🎉" />
            <StatCard value="1,000+" label="Listings" icon="🏠" />
            <StatCard value="50+" label="Cities" icon="🌎" />
          </div>
        </div>
      </section>

      {/* AI Chat */}
      <section className="bg-white border-b border-gray-100">
        <HomeAIChat />
      </section>

      {/* Featured Businesses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Featured Businesses</h2>
            <p className="text-gray-500 text-sm mt-1">
              Top-rated businesses in <span className="font-semibold text-[#1B4332]">{selectedCity}</span>
            </p>
          </div>
          <Link href="/directory" className="flex items-center gap-1 text-sm font-semibold text-[#1B4332] hover:text-[#52B788] transition-colors">
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
            description={`There are no businesses listed in ${selectedCity} yet. Try a different city or check back soon.`}
            city={selectedCity}
            actionLabel="Change Location"
            onAction={() => {
              const next = US_CITIES.find((c) => c.city !== selectedCity);
              if (next) { setSelectedCity(next.city); setSelectedState(next.state); }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Upcoming Events</h2>
              <p className="text-gray-500 text-sm mt-1">
                Community events in <span className="font-semibold text-[#1B4332]">{selectedCity}</span>
              </p>
            </div>
            <Link href="/events" className="flex items-center gap-1 text-sm font-semibold text-[#1B4332] hover:text-[#52B788] transition-colors">
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
              description={`No upcoming events in ${selectedCity}. Explore events in other cities.`}
              city={selectedCity}
              actionLabel="Browse All Events"
              onAction={() => {}}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </section>

      {/* Popular Cities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Explore by City</h2>
          <p className="text-gray-500">Community Connect is available across the United States</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {US_CITIES.slice(0, 10).map((c) => (
            <button
              key={`${c.city}-${c.state}`}
              onClick={() => { setSelectedCity(c.city); setSelectedState(c.state); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`group flex flex-col items-center justify-center py-5 px-3 rounded-2xl border transition-all duration-200 text-center ${
                selectedCity === c.city
                  ? 'bg-[#1B4332] border-[#1B4332] shadow-lg'
                  : 'bg-white border-gray-100 hover:border-[#52B788] hover:shadow-lg'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${selectedCity === c.city ? 'bg-white/20' : 'bg-gradient-to-br from-[#1B4332]/10 to-[#52B788]/20'}`}>
                <svg className={`w-5 h-5 ${selectedCity === c.city ? 'text-white' : 'text-[#1B4332]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <span className={`font-bold text-sm ${selectedCity === c.city ? 'text-white' : 'text-gray-800'}`}>{c.city}</span>
              <span className={`text-xs ${selectedCity === c.city ? 'text-white/70' : 'text-gray-400'}`}>{c.state}</span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">List Your Business for Free</h2>
          <p className="text-white/80 text-lg mb-8">Join thousands of community businesses and reach more customers today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-4 bg-white text-[#1B4332] font-bold rounded-2xl hover:bg-[#52B788] hover:text-white transition-all duration-300 shadow-xl text-lg">
              Get Started Free
            </Link>
            <Link href="/directory" className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all duration-300 text-lg">
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B4332] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="font-black text-white text-xl mb-2">Community Connect USA</div>
              <p className="text-white/60 text-sm">AI-powered community discovery for Muslim Americans and diverse communities.</p>
            </div>
            {[
              { title: 'Explore', links: [{ label: 'Directory', href: '/directory' }, { label: 'Events', href: '/events' }, { label: 'Housing', href: '/housing' }, { label: 'Jobs', href: '/jobs' }] },
              { title: 'Account', links: [{ label: 'Sign In', href: '/auth/login' }, { label: 'Sign Up', href: '/auth/register' }, { label: 'Profile', href: '/profile' }] },
              { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Contact', href: '#' }, { label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-white/60 hover:text-[#52B788] text-sm transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} Community Connect USA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
