'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useListings } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';

type AdminTab = 'overview' | 'businesses' | 'events' | 'housing' | 'jobs' | 'users' | 'messages' | 'listings';

const MOCK_USERS = [
  { id: '1', name: 'Administrator', email: 'admin@communityconnect.local', role: 'admin', createdAt: '2024-01-01' },
  { id: '2', name: 'Demo User', email: 'user@communityconnect.local', role: 'user', createdAt: '2024-01-15' },
];

function StatCard({ label, value, emoji, href, badge }: { label: string; value: number | string; emoji: string; href?: string; badge?: number }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
        </div>
        <div className="relative">
          <span className="text-3xl">{emoji}</span>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{badge}</span>
          )}
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function DataTable({ columns, rows }: { columns: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((c) => <th key={c} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => <td key={j} className="py-3 px-4 text-gray-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading, logout } = useApp();
  const { supportMessages, userMessages, unreadSupportCount, markSupportMessageRead } = useMessages();
  const { userListings, deleteListing } = useListings();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login?redirect=/admin');
      else if (user.role !== 'admin') router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] animate-pulse" />
      </div>
    );
  }

  const TABS: { key: AdminTab; label: string; emoji: string; badge?: number }[] = [
    { key: 'overview', label: t('admin', 'overview'), emoji: '📊' },
    { key: 'businesses', label: t('admin', 'businesses'), emoji: '🏪' },
    { key: 'events', label: t('admin', 'events'), emoji: '🎉' },
    { key: 'housing', label: t('admin', 'housing'), emoji: '🏠' },
    { key: 'jobs', label: t('admin', 'jobs'), emoji: '💼' },
    { key: 'listings', label: t('admin', 'userListings'), emoji: '📋', badge: userListings.length },
    { key: 'users', label: t('admin', 'users'), emoji: '👥' },
    { key: 'messages', label: t('admin', 'messages'), emoji: '💬', badge: unreadSupportCount },
  ];

  const recentActivity = [
    ...BUSINESSES.slice(0, 3).map((b) => ({ type: 'business', name: b.name, city: b.city, date: '2024-12-01' })),
    ...EVENTS.slice(0, 2).map((e) => ({ type: 'event', name: e.title, city: e.city, date: e.date })),
    ...userListings.slice(0, 3).map((l) => ({
      type: l.type,
      name: ('name' in l.data ? l.data.name as string : '') || ('title' in l.data ? l.data.title as string : '') || 'Untitled',
      city: l.data.city,
      date: l.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  const typeEmoji = (type: string) => type === 'business' ? '🏪' : type === 'event' ? '🎉' : type === 'housing' ? '🏠' : '💼';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('admin', 'welcomeBack')}, {user.name} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('admin', 'title')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/add-listing" className="px-4 py-2 text-sm font-semibold text-[#1B4332] border border-[#1B4332] rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('nav', 'addListing')}
          </Link>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('auth', 'logout')}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 flex-wrap mb-8 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key ? 'bg-[#1B4332] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{tab.badge > 9 ? '9+' : tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label={t('admin', 'totalUsers')} value={MOCK_USERS.length} emoji="👥" />
            <StatCard label={t('admin', 'totalBusinesses')} value={BUSINESSES.length} emoji="🏪" />
            <StatCard label={t('admin', 'totalEvents')} value={EVENTS.length} emoji="🎉" />
            <StatCard label={t('admin', 'totalHousing')} value={HOUSING.length} emoji="🏠" />
            <StatCard label={t('admin', 'totalJobs')} value={JOBS.length} emoji="💼" />
            <StatCard label={t('admin', 'userListings')} value={userListings.length} emoji="📋" />
            <StatCard label={t('admin', 'totalMessages')} value={supportMessages.length} emoji="💬" href="/admin/messages" badge={unreadSupportCount} />
            <StatCard label="User Messages" value={userMessages.length} emoji="✉️" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-black text-gray-900 mb-4">{t('admin', 'recentActivity')}</h3>
              {recentActivity.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xl">{typeEmoji(item.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.city}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900">{t('admin', 'latestMessages')}</h3>
                <Link href="/admin/messages" className="text-xs font-semibold text-[#1B4332] hover:underline">View all →</Link>
              </div>
              {supportMessages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {supportMessages.slice(-5).reverse().map((msg) => (
                    <div key={msg.id} className={`p-3 rounded-xl text-sm ${!msg.read ? 'bg-[#1B4332]/5 border border-[#52B788]/30' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">{msg.fromUserName}</span>
                        {!msg.read && <span className="text-[10px] font-bold text-[#52B788]">NEW</span>}
                      </div>
                      <p className="text-gray-600 text-xs line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'businesses' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900">{BUSINESSES.length} {t('admin', 'businesses')}</h3>
            <Link href="/add-listing" className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#0f2d21] transition-colors">+ Add</Link>
          </div>
          <DataTable
            columns={['Name', 'Category', 'City', 'Rating', 'Status']}
            rows={BUSINESSES.map((b) => [
              <span key="n" className="font-semibold">{b.name}</span>,
              b.category,
              `${b.city}, ${b.state}`,
              <span key="r">⭐ {b.rating}</span>,
              <span key="s" className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.isOpen ? 'bg-[#52B788]/15 text-[#1B4332]' : 'bg-red-50 text-red-600'}`}>{b.isOpen ? 'Open' : 'Closed'}</span>,
            ])}
          />
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900">{EVENTS.length} {t('admin', 'events')}</h3>
            <Link href="/add-listing" className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#0f2d21] transition-colors">+ Add</Link>
          </div>
          <DataTable
            columns={['Title', 'Organizer', 'Date', 'City', 'Price']}
            rows={EVENTS.map((e) => [
              <span key="t" className="font-semibold">{e.title}</span>,
              e.organizer,
              new Date(e.date).toLocaleDateString(),
              `${e.city}, ${e.state}`,
              e.isFree ? <span key="f" className="text-xs font-bold text-[#52B788]">Free</span> : `$${e.price}`,
            ])}
          />
        </div>
      )}

      {activeTab === 'housing' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900">{HOUSING.length} {t('admin', 'housing')}</h3>
            <Link href="/add-listing" className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#0f2d21] transition-colors">+ Add</Link>
          </div>
          <DataTable
            columns={['Title', 'Type', 'Price', 'City', 'Available']}
            rows={HOUSING.map((h) => [
              <span key="t" className="font-semibold">{h.title}</span>,
              `${h.propertyType} (${h.listingType})`,
              `$${h.price.toLocaleString()}${h.listingType === 'rent' ? '/mo' : ''}`,
              `${h.city}, ${h.state}`,
              <span key="a" className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.available ? 'bg-[#52B788]/15 text-[#1B4332]' : 'bg-red-50 text-red-600'}`}>{h.available ? 'Available' : 'Taken'}</span>,
            ])}
          />
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900">{JOBS.length} {t('admin', 'jobs')}</h3>
            <Link href="/add-listing" className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#0f2d21] transition-colors">+ Add</Link>
          </div>
          <DataTable
            columns={['Title', 'Company', 'Type', 'Salary', 'City']}
            rows={JOBS.map((j) => [
              <span key="t" className="font-semibold">{j.title}</span>,
              j.company,
              j.jobType,
              j.salary,
              `${j.city}, ${j.state}`,
            ])}
          />
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-900">{t('admin', 'userListings')} ({userListings.length})</h3>
          </div>
          {userListings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400">No user-submitted listings yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {userListings.map((listing) => {
                const title = ('name' in listing.data ? listing.data.name as string : '') || ('title' in listing.data ? listing.data.title as string : '') || 'Untitled';
                return (
                  <div key={listing.id} className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-xl flex-shrink-0">
                      {typeEmoji(listing.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{title}</p>
                      <p className="text-xs text-gray-500">{listing.publishedByName} · {listing.data.city}, {listing.data.state}</p>
                      <p className="text-xs text-gray-400">{new Date(listing.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${listing.status === 'active' ? 'bg-[#52B788]/15 text-[#1B4332]' : 'bg-yellow-100 text-yellow-700'}`}>
                        {listing.status}
                      </span>
                      <button onClick={() => deleteListing(listing.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-black text-gray-900">{MOCK_USERS.length} {t('admin', 'users')}</h3>
          </div>
          <DataTable
            columns={['Name', 'Email', 'Role', 'Joined']}
            rows={MOCK_USERS.map((u) => [
              <div key="u" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0)}</div>
                <span className="font-semibold">{u.name}</span>
              </div>,
              u.email,
              <span key="r" className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>,
              new Date(u.createdAt).toLocaleDateString(),
            ])}
          />
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-900">
              {supportMessages.length} messages
              {unreadSupportCount > 0 && <span className="text-sm font-semibold text-red-500 ml-2">({unreadSupportCount} unread)</span>}
            </h3>
            <Link href="/admin/messages" className="px-4 py-2 bg-[#1B4332] text-white text-sm font-bold rounded-xl hover:bg-[#0f2d21] transition-colors">Full view →</Link>
          </div>
          {supportMessages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-gray-400">No support messages yet.</p>
            </div>
          ) : (
            supportMessages
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((msg) => (
                <div key={msg.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${!msg.read ? 'border-[#52B788]/40 bg-[#1B4332]/[0.02]' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {msg.fromUserName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{msg.fromUserName}</span>
                          {!msg.read && <span className="bg-[#52B788] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{msg.fromUserEmail}</p>
                      <p className="text-sm text-gray-700 mt-2">{msg.content}</p>
                    </div>
                  </div>
                  {!msg.read && (
                    <button onClick={() => markSupportMessageRead(msg.id)} className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#1B4332] border border-[#1B4332]/30 rounded-xl hover:bg-[#1B4332]/5 transition-colors">
                      {t('messages', 'markRead')}
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
