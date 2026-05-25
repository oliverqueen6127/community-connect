'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useFavorites } from '@/lib/favorites-context';
import { useMessages } from '@/lib/messages-context';
import { useListings } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import { UserListing } from '@/lib/types';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import HousingCard from '@/components/cards/HousingCard';
import JobCard from '@/components/cards/JobCard';
import SupportMessenger from '@/components/support/SupportMessenger';

type Tab = 'overview' | 'favorites' | 'listings' | 'messages';

const STATUS_CFG = {
  active:   { label: 'Active',   cls: 'bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/25' },
  pending:  { label: 'Pending',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' },
  rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-400 border-red-500/25' },
};

const TYPE_ROUTE: Record<string, string> = {
  business: '/directory', event: '/events', housing: '/housing', job: '/jobs',
};

const TYPE_EMOJI: Record<string, string> = {
  business: '🏪', event: '🎉', housing: '🏠', job: '💼',
};

function getListingTitle(listing: UserListing): string {
  const d = listing.data as unknown as Record<string, unknown>;
  return (d.name as string) || (d.title as string) || 'Untitled';
}

function getListingCover(listing: UserListing): string | null {
  const d = listing.data as unknown as Record<string, unknown>;
  if (typeof d.image === 'string' && d.image) return d.image;
  if (Array.isArray(d.images) && d.images.length > 0) return d.images[0] as string;
  if (typeof d.logo === 'string' && d.logo) return d.logo;
  return null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffH = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const { user, isLoading, logout } = useApp();
  const { isSaved, toggleSaved, favoritesCount } = useFavorites();
  const { userMessages, supportMessages, replies, unreadUserCount, unreadReplyCount, markReplyRead, sendUserReply } = useMessages();
  const { getListingsByUser, deleteListing } = useListings();
  const { t } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login?redirect=/profile');
  }, [user, isLoading, router]);

  // Mark support replies read when user opens Messages tab
  useEffect(() => {
    if (tab !== 'messages') return;
    const thread = supportMessages[0];
    if (!thread) return;
    replies
      .filter((r) => r.supportMessageId === thread.id && r.senderRole === 'admin' && !r.read)
      .forEach((r) => markReplyRead(r.id));
  }, [tab, supportMessages, replies, markReplyRead]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const savedBusinesses = BUSINESSES.filter((b) => isSaved('businesses', b.id));
  const savedEvents = EVENTS.filter((e) => isSaved('events', e.id));
  const savedHousing = HOUSING.filter((h) => isSaved('housing', h.id));
  const savedJobs = JOBS.filter((j) => isSaved('jobs', j.id));
  const totalSaved = favoritesCount;

  const myListings = getListingsByUser(user.id);
  const myMessages = userMessages.filter((m) => m.fromUserId === user.id || m.toUserId === user.id);
  const unread = unreadUserCount(user.id);
  const totalMessages = myMessages.length + supportMessages.length;
  const totalUnread = unread + unreadReplyCount;

  const thread = supportMessages[0] ?? null;
  const threadReplies = thread ? replies.filter((r) => r.supportMessageId === thread.id) : [];
  const supportUnread = threadReplies.filter((r) => r.senderRole === 'admin' && !r.read).length;

  const TABS: { key: Tab; label: string; count?: number; badge?: number }[] = [
    { key: 'overview',  label: t('profile', 'overview') },
    { key: 'favorites', label: t('profile', 'myFavorites'), count: totalSaved },
    { key: 'listings',  label: t('profile', 'myListings'),  count: myListings.length },
    { key: 'messages',  label: t('profile', 'myMessages'),  count: totalMessages, badge: totalUnread },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Profile header ── */}
      <div className="rounded-3xl p-6 md:p-8 mb-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[#050816] text-3xl font-black shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 40px rgba(0,227,140,0.25)' }}>
            {user.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <p className="text-white/40 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'text-[#050816]' : 'border border-white/10 text-white/50'
                  }`} style={user.role === 'admin' ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}>
                    {user.role === 'admin' ? '⚡ Admin' : `👤 ${t('auth', 'user')}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {user.role === 'admin' && (
                  <Link href="/admin"
                    className="px-4 py-2 text-sm font-semibold text-[#050816] rounded-xl flex items-center gap-1.5 hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] transition-all"
                    style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('admin', 'title')}
                  </Link>
                )}
                <Link href="/add-listing"
                  className="px-4 py-2 text-sm font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 flex items-center gap-1.5 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('nav', 'addListing')}
                </Link>
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className="px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 flex items-center gap-1.5 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('auth', 'logout')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat cards (clickable, navigate to tab) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
          {([
            { tab: 'favorites' as Tab, label: t('profile', 'myFavorites'), value: totalSaved,        emoji: '❤️',  glow: 'rgba(239,68,68,0.15)' },
            { tab: 'listings'  as Tab, label: t('profile', 'myListings'),  value: myListings.length, emoji: '📋',  glow: 'rgba(0,227,140,0.15)' },
            { tab: 'messages'  as Tab, label: t('profile', 'myMessages'),  value: totalMessages,     emoji: '💬',  glow: 'rgba(0,194,255,0.15)', badge: totalUnread },
            { tab: 'overview'  as Tab, label: 'Browse',                    value: null,              emoji: '🔍',  glow: 'rgba(139,92,246,0.15)' },
          ] as { tab: Tab; label: string; value: number | null; emoji: string; glow: string; badge?: number }[]).map((s) => (
            <button
              key={s.tab + s.label}
              onClick={() => s.tab === 'overview' ? router.push('/directory') : setTab(s.tab)}
              className="relative text-center p-4 rounded-2xl hover:scale-[1.03] transition-all duration-200 group"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${s.glow}`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              {s.badge !== undefined && s.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center z-10">
                  {s.badge > 9 ? '9+' : s.badge}
                </span>
              )}
              <div className="text-2xl mb-2">{s.emoji}</div>
              {s.value !== null && <div className="text-2xl font-black text-white">{s.value}</div>}
              <div className="text-[11px] text-white/35 font-medium mt-0.5 leading-tight">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-2xl p-1.5 mb-6 overflow-x-auto"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 min-w-max flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap relative ${
              tab === tb.key ? 'text-[#050816]' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
            style={tab === tb.key ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
          >
            {tb.label}
            {tb.count !== undefined && tb.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === tb.key ? 'bg-black/10 text-[#050816]' : 'bg-white/10 text-white/60'}`}>
                {tb.count}
              </span>
            )}
            {tb.badge !== undefined && tb.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {tb.badge > 9 ? '9+' : tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Quick-action cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { action: () => setTab('favorites'), label: t('favorites', 'title'),  emoji: '❤️', count: totalSaved,        gradient: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.2)' },
              { action: () => setTab('listings'),  label: t('profile', 'myListings'), emoji: '📋', count: myListings.length, gradient: 'rgba(0,227,140,0.10)',   border: 'rgba(0,227,140,0.2)' },
              { action: () => setTab('messages'),  label: t('messages', 'title'),   emoji: '💬', count: myMessages.length,  gradient: 'rgba(0,194,255,0.10)',   border: 'rgba(0,194,255,0.2)' },
              { action: () => router.push('/directory'), label: t('nav', 'directory'), emoji: '🔍', count: null,             gradient: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.2)' },
            ] as { action: () => void; label: string; emoji: string; count: number | null; gradient: string; border: string }[]).map((card) => (
              <button
                key={card.label}
                onClick={card.action}
                className="p-5 rounded-2xl text-left hover:scale-[1.03] transition-all duration-200"
                style={{ background: card.gradient, border: `1px solid ${card.border}` }}
              >
                <div className="text-3xl mb-2">{card.emoji}</div>
                <p className="font-bold text-sm text-white/80">{card.label}</p>
                {card.count !== null && <p className="text-2xl font-black mt-1 text-white">{card.count}</p>}
              </button>
            ))}
          </div>

          {/* Recent listings preview */}
          {myListings.length > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white text-sm">Recent Listings</h3>
                <button onClick={() => setTab('listings')} className="text-xs text-[#00E38C] hover:text-[#00C2FF] transition-colors">
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {myListings.slice(0, 3).map((listing) => {
                  const cover = getListingCover(listing);
                  const cfg = STATUS_CFG[listing.status] ?? STATUS_CFG.pending;
                  return (
                    <div key={listing.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {cover
                          ? <img src={cover} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-base">{TYPE_EMOJI[listing.type]}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{getListingTitle(listing)}</p>
                        <p className="text-xs text-white/35">{listing.type} · {formatDate(listing.createdAt)}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Favorites ── */}
      {tab === 'favorites' && (
        <div>
          {totalSaved === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-lg font-bold text-white mb-2">{t('favorites', 'noFavorites')}</h3>
              <p className="text-white/30 mb-5 text-sm">{t('favorites', 'noFavoritesDesc')}</p>
              <Link href="/" className="px-5 py-2.5 text-[#050816] font-bold rounded-xl text-sm inline-block hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] transition-all"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                {t('favorites', 'browse')}
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {savedBusinesses.length > 0 && (
                <section>
                  <h3 className="font-black text-white mb-3 flex items-center gap-2">
                    🏪 Businesses
                    <span className="text-xs font-semibold bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20 px-2 py-0.5 rounded-full">{savedBusinesses.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedBusinesses.map((b) => <BusinessCard key={b.id} business={b} isSaved onSave={() => toggleSaved('businesses', b.id)} />)}
                  </div>
                </section>
              )}
              {savedHousing.length > 0 && (
                <section>
                  <h3 className="font-black text-white mb-3 flex items-center gap-2">
                    🏠 {t('nav', 'housing')}
                    <span className="text-xs font-semibold bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 px-2 py-0.5 rounded-full">{savedHousing.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedHousing.map((h) => <HousingCard key={h.id} housing={h} isSaved onSave={() => toggleSaved('housing', h.id)} />)}
                  </div>
                </section>
              )}
              {savedJobs.length > 0 && (
                <section>
                  <h3 className="font-black text-white mb-3 flex items-center gap-2">
                    💼 {t('nav', 'jobs')}
                    <span className="text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">{savedJobs.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedJobs.map((j) => <JobCard key={j.id} job={j} isSaved onSave={() => toggleSaved('jobs', j.id)} />)}
                  </div>
                </section>
              )}
              {savedEvents.length > 0 && (
                <section>
                  <h3 className="font-black text-white mb-3 flex items-center gap-2">
                    🎉 {t('nav', 'events')}
                    <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">{savedEvents.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedEvents.map((e) => <EventCard key={e.id} event={e} isSaved onSave={() => toggleSaved('events', e.id)} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── My Listings ── */}
      {tab === 'listings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white">{t('profile', 'myListings')}</h3>
            <Link href="/add-listing"
              className="px-4 py-2 text-[#050816] text-sm font-bold rounded-xl flex items-center gap-1.5 hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] transition-all"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('nav', 'addListing')}
            </Link>
          </div>
          {myListings.length === 0 ? (
            <div className="text-center py-16 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-bold text-white mb-2">{t('profile', 'noListings')}</h3>
              <p className="text-white/30 mb-5 text-sm">{t('profile', 'noListingsDesc')}</p>
              <Link href="/add-listing"
                className="px-5 py-2.5 text-[#050816] font-bold rounded-xl text-sm inline-block hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] transition-all"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                {t('profile', 'addListing')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((listing) => {
                const cover = getListingCover(listing);
                const cfg = STATUS_CFG[listing.status] ?? STATUS_CFG.pending;
                const viewHref = TYPE_ROUTE[listing.type] ?? '/directory';
                return (
                  <div key={listing.id}
                    className="rounded-2xl border p-4 flex items-center gap-4 hover:border-white/15 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Cover / emoji */}
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {cover
                        ? <img src={cover} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">{TYPE_EMOJI[listing.type]}</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{getListingTitle(listing)}</h4>
                      <p className="text-xs text-white/40 mt-0.5 capitalize">{listing.type} · {(listing.data as unknown as Record<string, unknown>).city as string}, {(listing.data as unknown as Record<string, unknown>).state as string}</p>
                      <p className="text-xs text-white/20 mt-0.5">{formatDate(listing.createdAt)}</p>
                    </div>

                    {/* Status + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <Link
                        href={viewHref}
                        className="p-2 text-white/40 hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded-xl transition-colors"
                        title="View category"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Delete listing"
                      >
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

      {/* ── Messages ── */}
      {tab === 'messages' && (
        <div className="space-y-6">
          {/* Support chat — inline, full Messenger */}
          {thread && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest">Support</h4>
                {supportUnread > 0 && (
                  <span className="text-xs font-bold text-[#00E38C]">{supportUnread} new</span>
                )}
              </div>
              <div
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  height: 'min(480px, 60vh)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <SupportMessenger
                  conversation={thread}
                  replies={threadReplies}
                  currentRole="user"
                  onSend={async (text) => {
                    await sendUserReply(thread.id, text);
                  }}
                />
              </div>
            </div>
          )}

          {/* No support thread yet */}
          {!thread && (
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(0,227,140,0.04)', border: '1px solid rgba(0,227,140,0.12)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.2), rgba(0,194,255,0.2))' }}>
                <svg className="w-5 h-5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Need help?</p>
                <p className="text-xs text-white/40">Start a conversation with our support team.</p>
              </div>
              <Link href="/support"
                className="px-4 py-2 text-[#050816] text-sm font-bold rounded-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                Contact Support
              </Link>
            </div>
          )}

          {/* Direct messages */}
          {myMessages.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Direct Messages</h4>
              <div className="space-y-3">
                {myMessages
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((msg) => {
                    const isFromMe = msg.fromUserId === user.id;
                    return (
                      <div key={msg.id}
                        className="rounded-2xl border p-4"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: !msg.read && !isFromMe ? '1px solid rgba(0,227,140,0.25)' : '1px solid rgba(255,255,255,0.08)',
                        }}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#050816] text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                            {(isFromMe ? msg.toUserName : msg.fromUserName).charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-white/30">{isFromMe ? `${t('messages', 'to')} ` : `${t('messages', 'from')} `}</span>
                              <span className="font-bold text-sm text-white">{isFromMe ? msg.toUserName : msg.fromUserName}</span>
                              {!msg.read && !isFromMe && (
                                <span className="bg-[#00E38C] text-[#050816] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t('messages', 'unread')}</span>
                              )}
                            </div>
                            {msg.listingTitle && <p className="text-xs text-white/30 mb-1">{t('messages', 'regarding')}: {msg.listingTitle}</p>}
                            <p className="text-sm text-white/70">{msg.content}</p>
                          </div>
                          <span className="text-xs text-white/20 flex-shrink-0">{formatDate(msg.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })}
                <Link href="/messages" className="block text-center py-3 text-sm font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">
                  {t('messages', 'inbox')} →
                </Link>
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalMessages === 0 && !thread && (
            <div className="text-center py-16 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-bold text-white mb-2">{t('messages', 'noMessages')}</h3>
              <p className="text-white/30 text-sm">{t('messages', 'noMessagesDesc')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
