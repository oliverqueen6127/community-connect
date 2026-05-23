'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import HousingCard from '@/components/cards/HousingCard';
import JobCard from '@/components/cards/JobCard';

export default function ProfilePage() {
  const { user, isLoading, isSaved, logout } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] animate-pulse" />
          <p className="text-gray-400 text-sm">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const savedBusinesses = BUSINESSES.filter((b) => isSaved('businesses', b.id));
  const savedEvents = EVENTS.filter((e) => isSaved('events', e.id));
  const savedHousing = HOUSING.filter((h) => isSaved('housing', h.id));
  const savedJobs = JOBS.filter((j) => isSaved('jobs', j.id));
  const totalSaved = savedBusinesses.length + savedEvents.length + savedHousing.length + savedJobs.length;

  const stats = [
    { label: 'Businesses', value: savedBusinesses.length, icon: '🏪' },
    { label: 'Événements', value: savedEvents.length, icon: '🎉' },
    { label: 'Logements', value: savedHousing.length, icon: '🏠' },
    { label: 'Emplois', value: savedJobs.length, icon: '💼' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8" style={{ animation: 'slideUp 0.4s ease' }}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
            {user.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {user.role === 'admin' ? '⚡ Administrateur' : '👤 Utilisateur'}
                  </span>
                  <span className="text-xs text-gray-400">ID: #{user.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-semibold bg-[#1B4332] text-white rounded-xl hover:bg-[#0f2d21] transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-2xl hover:bg-[#1B4332]/5 transition-colors">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved sections */}
      {totalSaved === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm" style={{ animation: 'slideUp 0.5s ease' }}>
          <div className="text-6xl mb-4">💾</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Aucun favori</h3>
          <p className="text-gray-400 mb-6 max-w-xs mx-auto">
            Explorez le répertoire et sauvegardez vos entreprises, événements, logements et emplois favoris.
          </p>
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity inline-block">
            Explorer maintenant
          </Link>
        </div>
      ) : (
        <>
          {savedBusinesses.length > 0 && (
            <section className="mb-10" style={{ animation: 'slideUp 0.5s ease' }}>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                🏪 <span>Businesses sauvegardés</span>
                <span className="text-sm font-semibold bg-[#1B4332]/10 text-[#1B4332] px-2.5 py-0.5 rounded-full">{savedBusinesses.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)}
              </div>
            </section>
          )}

          {savedEvents.length > 0 && (
            <section className="mb-10" style={{ animation: 'slideUp 0.55s ease' }}>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                🎉 <span>Événements sauvegardés</span>
                <span className="text-sm font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full">{savedEvents.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEvents.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {savedHousing.length > 0 && (
            <section className="mb-10" style={{ animation: 'slideUp 0.6s ease' }}>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                🏠 <span>Logements sauvegardés</span>
                <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">{savedHousing.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedHousing.map((h) => <HousingCard key={h.id} housing={h} />)}
              </div>
            </section>
          )}

          {savedJobs.length > 0 && (
            <section className="mb-10" style={{ animation: 'slideUp 0.65s ease' }}>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                💼 <span>Emplois sauvegardés</span>
                <span className="text-sm font-semibold bg-yellow-50 text-yellow-700 px-2.5 py-0.5 rounded-full">{savedJobs.length}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
