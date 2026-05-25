'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useListings } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import BusinessCard from '@/components/cards/BusinessCard';
import EventCard from '@/components/cards/EventCard';
import HousingCard from '@/components/cards/HousingCard';
import JobCard from '@/components/cards/JobCard';

type Tab = 'overview' | 'favorites' | 'listings' | 'messages';

const TYPE_EMOJI: Record<string, string> = {
  business: '🏪', event: '🎉', housing: '🏠', job: '💼',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffH = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const { user, isLoading, isSaved, toggleSaved, logout } = useApp();
  const { userMessages, supportMessages, replies, unreadUserCount, unreadReplyCount, markReplyRead } = useMessages();
  const { getListingsByUser, deleteListing } = useListings();
  const { t } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  React.useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login?redirect=/profile');
  }, [user, isLoading, router]);

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
  const totalSaved = savedBusinesses.length + savedEvents.length + savedHousing.length + savedJobs.length;

  const myListings = getListingsByUser(user.id);
  const myMessages = userMessages.filter((m) => m.fromUserId === user.id || m.toUserId === user.id);
  const unread = unreadUserCount(user.id);
  const totalMessages = myMessages.length + supportMessages.length;
  const totalUnread = unread + unreadReplyCount;

  const TABS: { key: Tab; label: string; count?: number; badge?: number }[] = [
    { key: 'overview', label: t('profile', 'overview') },
    { key: 'favorites', label: t('profile', 'myFavorites'), count: totalSaved },
    { key: 'listings', label: t('profile', 'myListings'), count: myListings.length },
    { key: 'messages', label: t('profile', 'myMessages'), count: totalMessages, badge: totalUnread },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-8">

      {/* Profile header */}
      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8 mb-6" style={{ animation: 'slideUp 0.4s ease' }}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[#050816] text-3xl font-black shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <p className="text-white/40 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin'
                      ? 'text-[#050816]'
                      : 'border border-white/10 text-white/50'
                  }`}
                  style={user.role === 'admin' ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}>
                    {user.role === 'admin' ? '⚡ Admin' : `👤 ${t('auth', 'user')}`}
                  </span>
                  <span className="text-xs text-white/20">ID: #{user.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {user.role === 'admin' && (
                  <Link href="/admin" className="px-4 py-2 text-sm font-semibold text-[#050816] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {t('admin', 'title')}
                  </Link>
                )}
                <Link href="/add-listing" className="px-4 py-2 text-sm font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-all flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
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
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-7">
          {[
            { label: t('profile', 'myFavorites'), value: totalSaved, emoji: '❤️' },
            { label: t('profile', 'myListings'), value: myListings.length, emoji: '📋' },
            { label: t('profile', 'myMessages'), value: myMessages.length, emoji: '💬' },
            { label: 'Businesses', value: savedBusinesses.length, emoji: '🏪' },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 bg-white/[0.03] border border-white/8 rounded-2xl hover:border-[#00E38C]/30 transition-all">
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className="text-[11px] text-white/30 font-medium leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass border border-white/8 rounded-2xl p-1.5 mb-6 overflow-x-auto">
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
                {tb.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/favorites', label: t('favorites', 'title'), emoji: '❤️', count: totalSaved, color: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/20' },
            { href: '/add-listing', label: t('addListing', 'title'), emoji: '➕', count: null, color: 'from-[#00E38C]/10 to-[#00C2FF]/10', border: 'border-[#00E38C]/20' },
            { href: '/messages', label: t('messages', 'title'), emoji: '💬', count: myMessages.length, color: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/20' },
            { href: '/directory', label: t('nav', 'directory'), emoji: '🔍', count: null, color: 'from-purple-500/10 to-violet-500/10', border: 'border-purple-500/20' },
          ].map((card) => (
            <Link key={card.href} href={card.href}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} text-white hover:scale-[1.02] transition-all duration-300`}>
              <div className="text-3xl mb-2">{card.emoji}</div>
              <p className="font-bold text-sm text-white/80">{card.label}</p>
              {card.count !== null && <p className="text-2xl font-black mt-1 text-white">{card.count}</p>}
            </Link>
          ))}
        </div>
      )}

      {tab === 'favorites' && (
        <div>
          {totalSaved === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-white/8">
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-lg font-bold text-white mb-2">{t('favorites', 'noFavorites')}</h3>
              <p className="text-white/30 mb-5 text-sm">{t('favorites', 'noFavoritesDesc')}</p>
              <Link href="/" className="px-5 py-2.5 text-[#050816] font-bold rounded-xl text-sm inline-block transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)]"
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

      {tab === 'listings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white">{t('profile', 'myListings')}</h3>
            <Link href="/add-listing" className="px-4 py-2 text-[#050816] text-sm font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)] flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {t('nav', 'addListing')}
            </Link>
          </div>
          {myListings.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-white/8">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-bold text-white mb-2">{t('profile', 'noListings')}</h3>
              <p className="text-white/30 mb-5 text-sm">{t('profile', 'noListingsDesc')}</p>
              <Link href="/add-listing" className="px-5 py-2.5 text-[#050816] font-bold rounded-xl text-sm inline-block transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)]"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                {t('profile', 'addListing')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((listing) => (
                <div key={listing.id} className="glass-card rounded-2xl border border-white/8 p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.2)' }}>
                    {TYPE_EMOJI[listing.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{('name' in listing.data ? listing.data.name : '') || ('title' in listing.data ? listing.data.title : '') || 'Untitled'}</h4>
                    <p className="text-xs text-white/40 mt-0.5">{listing.type} · {listing.data.city}, {listing.data.state}</p>
                    <p className="text-xs text-white/20">{formatDate(listing.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${listing.status === 'active' ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                      {listing.status}
                    </span>
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-6">
          {/* ── Support threads ── */}
          {supportMessages.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Support</h4>
              <div className="space-y-3">
                {supportMessages.map((msg) => {
                  const msgReplies = replies.filter((r) => r.supportMessageId === msg.id);
                  const unreadReplies = msgReplies.filter((r) => !r.read && r.senderRole === 'admin');
                  return (
                    <div key={msg.id} className={`glass-card rounded-2xl border p-4 ${unreadReplies.length > 0 ? 'border-[#00E38C]/30' : 'border-white/8'}`}>
                      {/* Original message */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-base flex-shrink-0">💬</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold text-white/60">You → Support</span>
                            {unreadReplies.length > 0 && (
                              <span className="bg-[#00E38C] text-[#050816] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadReplies.length} new reply
                              </span>
                            )}
                            <span className="text-xs text-white/20 ml-auto">{formatDate(msg.timestamp)}</span>
                          </div>
                          {msg.subject && <p className="text-xs font-semibold text-white/40 mb-1">{msg.subject}</p>}
                          <p className="text-sm text-white/60">{msg.content}</p>
                        </div>
                      </div>

                      {/* Admin replies */}
                      {msgReplies.length > 0 && (
                        <div className="mt-3 ml-12 border-l-2 border-[#00E38C]/20 pl-3 space-y-2">
                          {msgReplies.map((reply) => (
                            <div key={reply.id}
                              className={`rounded-xl p-3 ${!reply.read ? 'bg-[#00E38C]/5 border border-[#00E38C]/15' : 'bg-white/[0.03]'}`}
                              onClick={() => { if (!reply.read) markReplyRead(reply.id); }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[#00E38C]">↩ {reply.senderName}</span>
                                {!reply.read && <span className="bg-[#00E38C] text-[#050816] text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                                <span className="text-xs text-white/20">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-sm text-white/70">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Direct messages ── */}
          {myMessages.length > 0 && (
            <div>
              {supportMessages.length > 0 && (
                <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Direct Messages</h4>
              )}
              <div className="space-y-3">
                {myMessages
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((msg) => {
                    const isFromMe = msg.fromUserId === user.id;
                    return (
                      <div key={msg.id} className={`glass-card rounded-2xl border p-4 ${!msg.read && !isFromMe ? 'border-[#00E38C]/30' : 'border-white/8'}`}>
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

          {/* ── Empty state ── */}
          {totalMessages === 0 && (
            <div className="text-center py-16 glass-card rounded-3xl border border-white/8">
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
