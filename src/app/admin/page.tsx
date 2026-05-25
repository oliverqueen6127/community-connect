'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useListings } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import { Business, Event, Housing, Job } from '@/lib/types';

type AdminTab = 'overview' | 'businesses' | 'events' | 'housing' | 'jobs' | 'users' | 'messages' | 'listings';

const MOCK_USERS = [
  { id: '1', name: 'Administrator', email: 'admin@communityconnect.local', role: 'admin', createdAt: '2024-01-01' },
  { id: '2', name: 'Demo User', email: 'user@communityconnect.local', role: 'user', createdAt: '2024-01-15' },
];

function StatCard({ label, value, emoji, href, badge }: { label: string; value: number | string; emoji: string; href?: string; badge?: number }) {
  const inner = (
    <div className="glass-card border border-white/8 hover:border-[#00E38C]/30 rounded-2xl p-5 transition-all duration-300 cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40 font-medium">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value}</p>
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
          <tr className="border-b border-white/8">
            {columns.map((c) => <th key={c} className="text-left py-3 px-4 text-xs font-bold text-white/30 uppercase tracking-wide">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
              {row.map((cell, j) => <td key={j} className="py-3 px-4 text-white/70">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const typeEmoji = (type: string) => type === 'business' ? '🏪' : type === 'event' ? '🎉' : type === 'housing' ? '🏠' : '💼';

export default function AdminPage() {
  const { user, isLoading, logout } = useApp();
  const { supportMessages, userMessages, unreadSupportCount, markSupportMessageRead } = useMessages();
  const { userListings, deleteListing, isLoading: listingsLoading } = useListings();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login?redirect=/admin');
      else if (user.role !== 'admin' || user.id !== 'mock-admin-1') router.push('/');
    }
  }, [user, isLoading, router]);

<<<<<<< HEAD
  // ── Merge static seed data with user-submitted Supabase listings ───────────
  // Admin sees EVERYTHING: mock seed data + all user-submitted rows from Supabase.
  const supabaseBusinesses = useMemo(
    () => userListings.filter((l) => l.type === 'business').map((l) => l.data as Business),
    [userListings],
  );
  const supabaseEvents = useMemo(
    () => userListings.filter((l) => l.type === 'event').map((l) => l.data as Event),
    [userListings],
  );
  const supabaseHousing = useMemo(
    () => userListings.filter((l) => l.type === 'housing').map((l) => l.data as Housing),
    [userListings],
  );
  const supabaseJobs = useMemo(
    () => userListings.filter((l) => l.type === 'job').map((l) => l.data as Job),
    [userListings],
  );

  const allBusinesses = useMemo(() => {
    const ids = new Set(BUSINESSES.map((b) => b.id));
    return [...BUSINESSES, ...supabaseBusinesses.filter((b) => !ids.has(b.id))];
  }, [supabaseBusinesses]);

  const allEvents = useMemo(() => {
    const ids = new Set(EVENTS.map((e) => e.id));
    return [...EVENTS, ...supabaseEvents.filter((e) => !ids.has(e.id))];
  }, [supabaseEvents]);

  const allHousing = useMemo(() => {
    const ids = new Set(HOUSING.map((h) => h.id));
    return [...HOUSING, ...supabaseHousing.filter((h) => !ids.has(h.id))];
  }, [supabaseHousing]);

  const allJobs = useMemo(() => {
    const ids = new Set(JOBS.map((j) => j.id));
    return [...JOBS, ...supabaseJobs.filter((j) => !ids.has(j.id))];
  }, [supabaseJobs]);

  if (isLoading || !user || user.role !== 'admin') {
=======
  if (isLoading || !user || user.role !== 'admin' || user.id !== 'mock-admin-1') {
>>>>>>> de3d26a (supabase v4)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const TABS: { key: AdminTab; label: string; emoji: string; badge?: number }[] = [
    { key: 'overview', label: t('admin', 'overview'), emoji: '📊' },
    { key: 'businesses', label: t('admin', 'businesses'), emoji: '🏪', badge: supabaseBusinesses.length },
    { key: 'events', label: t('admin', 'events'), emoji: '🎉', badge: supabaseEvents.length },
    { key: 'housing', label: t('admin', 'housing'), emoji: '🏠', badge: supabaseHousing.length },
    { key: 'jobs', label: t('admin', 'jobs'), emoji: '💼', badge: supabaseJobs.length },
    { key: 'listings', label: t('admin', 'userListings'), emoji: '📋', badge: userListings.length },
    { key: 'users', label: t('admin', 'users'), emoji: '👥' },
    { key: 'messages', label: t('admin', 'messages'), emoji: '💬', badge: unreadSupportCount },
  ];

  const recentActivity = [
    ...userListings.slice(0, 8).map((l) => ({
      type: l.type,
      name: ('name' in l.data ? l.data.name as string : '') || ('title' in l.data ? l.data.title as string : '') || 'Untitled',
      city: l.data.city,
      date: l.createdAt,
      source: 'supabase',
    })),
    ...BUSINESSES.slice(0, 3).map((b) => ({ type: 'business', name: b.name, city: b.city, date: '2024-12-01', source: 'seed' })),
    ...EVENTS.slice(0, 2).map((e) => ({ type: 'event', name: e.title, city: e.city, date: e.date, source: 'seed' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{t('admin', 'welcomeBack')}, {user.name} 👋</h1>
          <p className="text-white/40 text-sm mt-0.5">{t('admin', 'title')}</p>
          {listingsLoading && (
            <p className="text-[#00E38C] text-xs mt-1 animate-pulse">Loading listings from Supabase…</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/add-listing" className="px-4 py-2 text-sm font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-all flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('nav', 'addListing')}
          </Link>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('auth', 'logout')}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 flex-wrap mb-8 glass border border-white/8 rounded-2xl p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key ? 'text-[#050816]' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${activeTab === tab.key ? 'bg-black/20 text-[#050816]' : 'bg-red-500 text-white'}`}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label={t('admin', 'totalUsers')} value={MOCK_USERS.length} emoji="👥" />
            <StatCard label={t('admin', 'totalBusinesses')} value={allBusinesses.length} emoji="🏪" />
            <StatCard label={t('admin', 'totalEvents')} value={allEvents.length} emoji="🎉" />
            <StatCard label={t('admin', 'totalHousing')} value={allHousing.length} emoji="🏠" />
            <StatCard label={t('admin', 'totalJobs')} value={allJobs.length} emoji="💼" />
            <StatCard label="Supabase Listings" value={userListings.length} emoji="📋" />
            <StatCard label={t('admin', 'totalMessages')} value={supportMessages.length} emoji="💬" href="/admin/messages" badge={unreadSupportCount} />
            <StatCard label="User Messages" value={userMessages.length} emoji="✉️" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass border border-white/8 rounded-2xl p-5">
              <h3 className="font-black text-white mb-4">{t('admin', 'recentActivity')}</h3>
              {recentActivity.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xl">{typeEmoji(item.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs text-white/30">{item.city}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.source === 'supabase' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20">DB</span>
                        )}
                        <span className="text-xs text-white/20">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white">{t('admin', 'latestMessages')}</h3>
                <Link href="/admin/messages" className="text-xs font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">View all →</Link>
              </div>
              {supportMessages.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {supportMessages.slice(-5).reverse().map((msg) => (
                    <div key={msg.id} className={`p-3 rounded-xl text-sm border ${!msg.read ? 'bg-[#00E38C]/5 border-[#00E38C]/20' : 'bg-white/[0.03] border-white/8'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{msg.fromUserName}</span>
                        {!msg.read && <span className="text-[10px] font-bold text-[#00E38C]">NEW</span>}
                      </div>
                      <p className="text-white/40 text-xs line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Businesses (seed + Supabase) ── */}
      {activeTab === 'businesses' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allBusinesses.length} {t('admin', 'businesses')}</h3>
              <p className="text-xs text-white/30 mt-0.5">
                {BUSINESSES.length} seed · <span className="text-[#00E38C]">{supabaseBusinesses.length} from Supabase</span>
              </p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? (
            <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div>
          ) : (
            <DataTable
              columns={['Name', 'Category', 'City', 'Rating', 'Status', 'Source']}
              rows={allBusinesses.map((b) => {
                const isDb = !BUSINESSES.find((x) => x.id === b.id);
                return [
                  <span key="n" className="font-semibold text-white">{b.name}</span>,
                  b.category,
                  `${b.city}, ${b.state}`,
                  <span key="r">⭐ {b.rating}</span>,
                  <span key="s" className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.isOpen ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{b.isOpen ? 'Open' : 'Closed'}</span>,
                  <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
                ];
              })}
            />
          )}
        </div>
      )}

      {/* ── Events (seed + Supabase) ── */}
      {activeTab === 'events' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allEvents.length} {t('admin', 'events')}</h3>
              <p className="text-xs text-white/30 mt-0.5">
                {EVENTS.length} seed · <span className="text-[#00E38C]">{supabaseEvents.length} from Supabase</span>
              </p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? (
            <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div>
          ) : (
            <DataTable
              columns={['Title', 'Organizer', 'Date', 'City', 'Price', 'Source']}
              rows={allEvents.map((e) => {
                const isDb = !EVENTS.find((x) => x.id === e.id);
                return [
                  <span key="t" className="font-semibold text-white">{e.title}</span>,
                  e.organizer,
                  new Date(e.date).toLocaleDateString(),
                  `${e.city}, ${e.state}`,
                  e.isFree ? <span key="f" className="text-xs font-bold text-[#00E38C]">Free</span> : `$${e.price}`,
                  <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
                ];
              })}
            />
          )}
        </div>
      )}

      {/* ── Housing (seed + Supabase) ── */}
      {activeTab === 'housing' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allHousing.length} {t('admin', 'housing')}</h3>
              <p className="text-xs text-white/30 mt-0.5">
                {HOUSING.length} seed · <span className="text-[#00E38C]">{supabaseHousing.length} from Supabase</span>
              </p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? (
            <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div>
          ) : (
            <DataTable
              columns={['Title', 'Type', 'Price', 'City', 'Available', 'Source']}
              rows={allHousing.map((h) => {
                const isDb = !HOUSING.find((x) => x.id === h.id);
                return [
                  <span key="t" className="font-semibold text-white">{h.title}</span>,
                  `${h.propertyType} (${h.listingType})`,
                  `$${h.price.toLocaleString()}${h.listingType === 'rent' ? '/mo' : ''}`,
                  `${h.city}, ${h.state}`,
                  <span key="a" className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.available ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{h.available ? 'Available' : 'Taken'}</span>,
                  <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
                ];
              })}
            />
          )}
        </div>
      )}

      {/* ── Jobs (seed + Supabase) ── */}
      {activeTab === 'jobs' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allJobs.length} {t('admin', 'jobs')}</h3>
              <p className="text-xs text-white/30 mt-0.5">
                {JOBS.length} seed · <span className="text-[#00E38C]">{supabaseJobs.length} from Supabase</span>
              </p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? (
            <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div>
          ) : (
            <DataTable
              columns={['Title', 'Company', 'Type', 'Salary', 'City', 'Source']}
              rows={allJobs.map((j) => {
                const isDb = !JOBS.find((x) => x.id === j.id);
                return [
                  <span key="t" className="font-semibold text-white">{j.title}</span>,
                  j.company,
                  j.jobType,
                  j.salary,
                  `${j.city}, ${j.state}`,
                  <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
                ];
              })}
            />
          )}
        </div>
      )}

      {/* ── User Listings (all from Supabase) ── */}
      {activeTab === 'listings' && (
        <div className="glass border border-white/8 rounded-2xl">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{t('admin', 'userListings')} ({userListings.length})</h3>
              <p className="text-xs text-white/30 mt-0.5">All user-submitted listings from Supabase</p>
            </div>
            {listingsLoading && <span className="text-[#00E38C] text-xs animate-pulse">Syncing…</span>}
          </div>
          {userListings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-white/30">{listingsLoading ? 'Loading from Supabase…' : 'No user-submitted listings yet.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {userListings.map((listing) => {
                const title = ('name' in listing.data ? listing.data.name as string : '') || ('title' in listing.data ? listing.data.title as string : '') || 'Untitled';
                return (
                  <div key={listing.id} className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.2)' }}>
                      {typeEmoji(listing.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{title}</p>
                      <p className="text-xs text-white/40">{listing.publishedByName || listing.publishedBy} · {listing.data.city}, {listing.data.state}</p>
                      <p className="text-xs text-white/20">{new Date(listing.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${listing.status === 'active' ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                        {listing.status}
                      </span>
                      <button onClick={() => deleteListing(listing.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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

      {/* ── Users ── */}
      {activeTab === 'users' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h3 className="font-black text-white">{MOCK_USERS.length} {t('admin', 'users')}</h3>
          </div>
          <DataTable
            columns={['Name', 'Email', 'Role', 'Joined']}
            rows={MOCK_USERS.map((u) => [
              <div key="u" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#050816] text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                  {u.name.charAt(0)}
                </div>
                <span className="font-semibold text-white">{u.name}</span>
              </div>,
              u.email,
              <span key="r" className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'text-[#050816]' : 'bg-white/10 text-white/60 border border-white/10'}`}
                style={u.role === 'admin' ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}>
                {u.role}
              </span>,
              new Date(u.createdAt).toLocaleDateString(),
            ])}
          />
        </div>
      )}

      {/* ── Messages ── */}
      {activeTab === 'messages' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-white">
              {supportMessages.length} messages
              {unreadSupportCount > 0 && <span className="text-sm font-semibold text-red-400 ml-2">({unreadSupportCount} unread)</span>}
            </h3>
            <Link href="/admin/messages" className="px-4 py-2 text-[#050816] text-sm font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>Full view →</Link>
          </div>
          {supportMessages.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-white/8">
              <div className="text-5xl mb-4">💬</div>
              <p className="text-white/30">No support messages yet.</p>
            </div>
          ) : (
            supportMessages
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((msg) => (
                <div key={msg.id} className={`glass-card rounded-2xl border p-5 ${!msg.read ? 'border-[#00E38C]/30' : 'border-white/8'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#050816] text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                      {msg.fromUserName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{msg.fromUserName}</span>
                          {!msg.read && <span className="bg-[#00E38C] text-[#050816] text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <span className="text-xs text-white/20">{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">{msg.fromUserEmail}</p>
                      <p className="text-sm text-white/70 mt-2">{msg.content}</p>
                    </div>
                  </div>
                  {!msg.read && (
                    <button onClick={() => markSupportMessageRead(msg.id)} className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-colors">
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
