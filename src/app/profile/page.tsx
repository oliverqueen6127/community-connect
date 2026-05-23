'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import HousingCard from '@/components/cards/HousingCard';
import JobCard from '@/components/cards/JobCard';

export default function ProfilePage() {
  const { user, isSaved } = useApp();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 mb-6">Please sign in to view your profile</p>
          <Link href="/auth/login" className="px-8 py-3 bg-[#1B4332] text-white font-bold rounded-2xl hover:bg-[#0f2d21] transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const savedBusinesses = BUSINESSES.filter((b) => isSaved('businesses', b.id));
  const savedEvents = EVENTS.filter((e) => isSaved('events', e.id));
  const savedHousing = HOUSING.filter((h) => isSaved('housing', h.id));
  const savedJobs = JOBS.filter((j) => isSaved('jobs', j.id));

  const stats = [
    { label: 'Saved Businesses', value: savedBusinesses.length, icon: '🏪' },
    { label: 'Saved Events', value: savedEvents.length, icon: '🎉' },
    { label: 'Saved Housing', value: savedHousing.length, icon: '🏠' },
    { label: 'Saved Jobs', value: savedJobs.length, icon: '💼' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8" style={{ animation: 'slideUp 0.4s ease' }}>
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                <p className="text-gray-500">{user.email}</p>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-3 py-1 bg-[#1B4332] text-white rounded-full text-xs font-bold mt-2">
                    Admin
                  </span>
                )}
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:border-[#52B788] hover:text-[#1B4332] transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-2xl">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Items */}
      {savedBusinesses.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Saved Businesses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
        </section>
      )}

      {savedEvents.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Saved Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEvents.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {savedHousing.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Saved Housing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedHousing.map((h) => <HousingCard key={h.id} housing={h} />)}
          </div>
        </section>
      )}

      {savedJobs.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-4">Saved Jobs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        </section>
      )}

      {savedBusinesses.length === 0 && savedEvents.length === 0 && savedHousing.length === 0 && savedJobs.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <div className="text-6xl mb-4">💾</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Nothing saved yet</h3>
          <p className="text-gray-400 mb-6">Start exploring and save your favorite listings</p>
          <Link href="/" className="px-6 py-3 bg-[#1B4332] text-white font-bold rounded-2xl hover:bg-[#0f2d21] transition-colors">
            Explore Now
          </Link>
        </div>
      )}
    </div>
  );
}
