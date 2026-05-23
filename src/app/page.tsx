import React from 'react';
import Link from 'next/link';
import HomeAIChat from '@/components/chat/HomeAIChat';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import { BUSINESSES, EVENTS, US_CITIES } from '@/lib/data';

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-black text-white">{value}</div>
      <div className="text-[#52B788] text-sm font-medium mt-1">{icon} {label}</div>
    </div>
  );
}

export default function HomePage() {
  const featuredBusinesses = BUSINESSES.slice(0, 6);
  const upcomingEvents = EVENTS.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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

          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ animation: 'slideUp 0.7s ease' }}>
            Discover halal restaurants, mosques, housing, jobs, and events near you.
            Just ask — our AI does the rest.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8" style={{ animation: 'slideUp 0.8s ease' }}>
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

      {/* AI Chat Section */}
      <section className="bg-white border-b border-gray-100">
        <HomeAIChat />
      </section>

      {/* Featured Businesses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">Featured Businesses</h2>
            <p className="text-gray-500 text-sm mt-1">Top-rated community businesses</p>
          </div>
          <Link
            href="/directory"
            className="flex items-center gap-1 text-sm font-semibold text-[#1B4332] hover:text-[#52B788] transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Upcoming Events</h2>
              <p className="text-gray-500 text-sm mt-1">Community gatherings near you</p>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-1 text-sm font-semibold text-[#1B4332] hover:text-[#52B788] transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
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
            <Link
              key={`${c.city}-${c.state}`}
              href={`/directory?city=${encodeURIComponent(c.city)}&state=${c.state}`}
              className="group flex flex-col items-center justify-center py-5 px-3 bg-white rounded-2xl border border-gray-100 hover:border-[#52B788] hover:shadow-lg transition-all duration-200 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332]/10 to-[#52B788]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-[#1B4332]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <span className="font-bold text-gray-800 text-sm">{c.city}</span>
              <span className="text-xs text-gray-400">{c.state}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="hero-gradient py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            List Your Business for Free
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of community businesses and reach more customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-[#1B4332] font-bold rounded-2xl hover:bg-[#52B788] hover:text-white transition-all duration-300 shadow-xl text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/directory"
              className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all duration-300 text-lg"
            >
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
