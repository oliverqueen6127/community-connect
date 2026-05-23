'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';

type TabType = 'overview' | 'businesses' | 'events' | 'housing' | 'jobs' | 'users';

function StatCard({ label, value, icon, change, color }: { label: string; value: string | number; icon: string; change?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
        {change && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{change}</span>
        )}
      </div>
      <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading, logout } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [businessSearch, setBusinessSearch] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/auth/login?redirect=/admin');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] animate-pulse" />
          <p className="text-gray-400 text-sm">Vérification des droits...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'businesses', label: 'Businesses', icon: '🏪' },
    { id: 'events', label: 'Events', icon: '🎉' },
    { id: 'housing', label: 'Housing', icon: '🏠' },
    { id: 'jobs', label: 'Jobs', icon: '💼' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  const filteredBusinesses = BUSINESSES.filter(
    (b) => !businessSearch || b.name.toLowerCase().includes(businessSearch.toLowerCase()) || b.city.toLowerCase().includes(businessSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white font-black text-lg shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-none">Admin Dashboard</h1>
              <p className="text-[#52B788] font-semibold text-sm">Welcome, {user.name} 👋</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-1">Community Connect USA — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-[#52B788] transition-colors">
            ← Back to Site
          </Link>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-white text-[#1B4332] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Businesses" value={BUSINESSES.length} icon="🏪" change="+12%" color="bg-blue-50" />
            <StatCard label="Total Events" value={EVENTS.length} icon="🎉" change="+8%" color="bg-purple-50" />
            <StatCard label="Housing Listings" value={HOUSING.length} icon="🏠" change="+5%" color="bg-green-50" />
            <StatCard label="Job Listings" value={JOBS.length} icon="💼" change="+15%" color="bg-yellow-50" />
            <StatCard label="Total Users" value="1,247" icon="👥" change="+23%" color="bg-pink-50" />
            <StatCard label="AI Searches Today" value="342" icon="🤖" change="+41%" color="bg-indigo-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: 'New business listing submitted', time: '2 min ago', type: '🏪' },
                  { action: 'User registered: ahmed@example.com', time: '5 min ago', type: '👤' },
                  { action: 'AI search: "halal restaurants in NY"', time: '8 min ago', type: '🤖' },
                  { action: 'New event posted: Eid Celebration', time: '12 min ago', type: '🎉' },
                  { action: 'Housing listing: 2BR Chicago', time: '18 min ago', type: '🏠' },
                  { action: 'Job application submitted', time: '25 min ago', type: '💼' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xl">{item.type}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{item.action}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Top Searches This Week</h3>
              <div className="space-y-3">
                {[
                  { query: 'halal restaurants', count: 89, pct: 90 },
                  { query: 'mosques near me', count: 67, pct: 68 },
                  { query: 'apartments under $1500', count: 54, pct: 55 },
                  { query: 'delivery jobs', count: 48, pct: 49 },
                  { query: 'free events', count: 41, pct: 42 },
                  { query: 'islamic school', count: 35, pct: 36 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{item.query}</span>
                        <span className="text-gray-400">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#1B4332] to-[#52B788]"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Businesses Tab */}
      {activeTab === 'businesses' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <input
                value={businessSearch}
                onChange={(e) => setBusinessSearch(e.target.value)}
                placeholder="Search businesses..."
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#52B788] flex-1 max-w-xs"
              />
              <button className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2d21] transition-colors">
                + Add Business
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Category', 'City', 'Rating', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBusinesses.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={b.image} alt={b.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{b.name}</div>
                            <div className="text-xs text-gray-400">{b.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{b.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.city}, {b.state}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-semibold">{b.rating}</span>
                          <span className="text-xs text-gray-400">({b.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {b.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between">
              <h3 className="font-bold text-gray-900">All Events ({EVENTS.length})</h3>
              <button className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2d21] transition-colors">
                + Add Event
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Title', 'Date', 'City', 'Attendees', 'Price', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {EVENTS.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.city}, {e.state}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.attendees.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.isFree ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {e.isFree ? 'Free' : `$${e.price}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Housing Tab */}
      {activeTab === 'housing' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between">
              <h3 className="font-bold text-gray-900">All Housing ({HOUSING.length})</h3>
              <button className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2d21] transition-colors">
                + Add Listing
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Title', 'Type', 'City', 'Price', 'Beds/Bath', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {HOUSING.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{h.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.listingType === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          For {h.listingType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{h.city}, {h.state}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#1B4332]">${h.price.toLocaleString()}{h.listingType === 'rent' ? '/mo' : ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{h.bedrooms}bd / {h.bathrooms}ba</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between">
              <h3 className="font-bold text-gray-900">All Jobs ({JOBS.length})</h3>
              <button className="px-4 py-2 bg-[#1B4332] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2d21] transition-colors">
                + Add Job
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Title', 'Company', 'City', 'Salary', 'Type', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {JOBS.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{j.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{j.company}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{j.remote ? '🌐 Remote' : `${j.city}, ${j.state}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{j.salary}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 capitalize">
                          {j.jobType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button className="text-xs text-blue-600 hover:underline">Edit</button>
                          <button className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-6">User Management</h3>
            <div className="space-y-4">
              {[
                { name: 'Ahmed Hassan', email: 'ahmed@example.com', role: 'user', joined: '2026-04-15', searches: 42 },
                { name: 'Fatima Al-Rashid', email: 'fatima@example.com', role: 'user', joined: '2026-04-20', searches: 28 },
                { name: 'Omar Abdullah', email: 'omar@example.com', role: 'admin', joined: '2026-03-01', searches: 115 },
                { name: 'Aisha Johnson', email: 'aisha@example.com', role: 'user', joined: '2026-05-02', searches: 17 },
                { name: 'Yusuf Martinez', email: 'yusuf@example.com', role: 'user', joined: '2026-05-10', searches: 9 },
              ].map((user, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="text-sm font-bold text-gray-700">{user.searches}</div>
                    <div className="text-xs text-gray-400">searches</div>
                  </div>
                  <div className="text-xs text-gray-400 hidden md:block">Joined {user.joined}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-[#1B4332] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
