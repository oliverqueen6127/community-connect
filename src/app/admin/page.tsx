'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useListings } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { BUSINESSES, EVENTS, HOUSING, JOBS } from '@/lib/data';
import { Business, Event, Housing, Job } from '@/lib/types';

type AdminTab = 'overview' | 'businesses' | 'events' | 'housing' | 'jobs' | 'users' | 'messages' | 'listings';
type ListingFilter = 'all' | 'pending' | 'active' | 'rejected';
type UserRoleFilter = 'all' | 'user' | 'admin';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, emoji, onTab, badge, color }: {
  label: string; value: number | string; emoji: string;
  onTab?: () => void; badge?: number; color?: string;
}) {
  return (
    <button
      onClick={onTab}
      className="w-full text-left glass-card border border-white/8 hover:border-[#00E38C]/50 hover:shadow-[0_0_20px_rgba(0,227,140,0.12)] rounded-2xl p-5 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40 font-medium">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="relative">
            <span className="text-2xl">{emoji}</span>
            {badge !== undefined && badge > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{badge}</span>
            )}
          </div>
          <svg className={`w-3 h-3 transition-colors ${color ?? 'text-white/20 group-hover:text-[#00E38C]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: 'active' | 'pending' | 'rejected' | string }) {
  const cfg = status === 'active'
    ? 'bg-[#00E38C]/10 text-[#00E38C] border-[#00E38C]/20'
    : status === 'rejected'
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg}`}>{status}</span>;
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isLoading, logout } = useApp();
  const { supportMessages, unreadSupportCount, markSupportMessageRead, deleteSupportMessage, sendSupportMessage } = useMessages();
  const { userListings, deleteListing, approveListing, rejectListing, isLoading: listingsLoading } = useListings();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>('all');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login?redirect=/admin');
      else if (user.role !== 'admin' || user.id !== 'mock-admin-1') router.push('/');
    }
  }, [user, isLoading, router]);

  // ── Fetch users when Users tab is opened ───────────────────────────────────
  useEffect(() => {
    if (activeTab === 'users' && !users) {
      setUsersLoading(true);
      fetch('/api/admin-users')
        .then((r) => r.json())
        .then(({ users: u }: { users: AdminUser[] }) => setUsers(u ?? []))
        .catch(() => setUsers([]))
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab, users]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const supabaseBusinesses = useMemo(() => userListings.filter((l) => l.type === 'business').map((l) => l.data as Business), [userListings]);
  const supabaseEvents = useMemo(() => userListings.filter((l) => l.type === 'event').map((l) => l.data as Event), [userListings]);
  const supabaseHousing = useMemo(() => userListings.filter((l) => l.type === 'housing').map((l) => l.data as Housing), [userListings]);
  const supabaseJobs = useMemo(() => userListings.filter((l) => l.type === 'job').map((l) => l.data as Job), [userListings]);

  const allBusinesses = useMemo(() => { const ids = new Set(BUSINESSES.map((b) => b.id)); return [...BUSINESSES, ...supabaseBusinesses.filter((b) => !ids.has(b.id))]; }, [supabaseBusinesses]);
  const allEvents = useMemo(() => { const ids = new Set(EVENTS.map((e) => e.id)); return [...EVENTS, ...supabaseEvents.filter((e) => !ids.has(e.id))]; }, [supabaseEvents]);
  const allHousing = useMemo(() => { const ids = new Set(HOUSING.map((h) => h.id)); return [...HOUSING, ...supabaseHousing.filter((h) => !ids.has(h.id))]; }, [supabaseHousing]);
  const allJobs = useMemo(() => { const ids = new Set(JOBS.map((j) => j.id)); return [...JOBS, ...supabaseJobs.filter((j) => !ids.has(j.id))]; }, [supabaseJobs]);

  const pendingCount = userListings.filter((l) => l.status === 'pending').length;
  const filteredListings = useMemo(() =>
    listingFilter === 'all' ? userListings : userListings.filter((l) => l.status === listingFilter),
    [userListings, listingFilter],
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, userSearch, userRoleFilter]);

  // ── Admin reply to support message ─────────────────────────────────────────
  const handleReply = useCallback(async (targetMsg: { id: string; fromUserEmail: string; fromUserName: string }) => {
    if (!replyText.trim()) return;
    setReplying(true);
    sendSupportMessage({
      fromUserId: 'mock-admin-1',
      fromUserName: 'Community Connect Support',
      fromUserEmail: 'admin@communityconnect.local',
      subject: `Re: message from ${targetMsg.fromUserName}`,
      content: replyText.trim(),
      page: '/admin',
    });
    setReplyTarget(null);
    setReplyText('');
    setReplying(false);
  }, [replyText, sendSupportMessage]);

  // ── Loading guard ──────────────────────────────────────────────────────────
  if (isLoading || !user || user.role !== 'admin' || user.id !== 'mock-admin-1') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const goto = (tab: AdminTab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const TABS: { key: AdminTab; label: string; emoji: string; badge?: number }[] = [
    { key: 'overview', label: t('admin', 'overview'), emoji: '📊' },
    { key: 'businesses', label: t('admin', 'businesses'), emoji: '🏪', badge: supabaseBusinesses.length },
    { key: 'events', label: t('admin', 'events'), emoji: '🎉', badge: supabaseEvents.length },
    { key: 'housing', label: t('admin', 'housing'), emoji: '🏠', badge: supabaseHousing.length },
    { key: 'jobs', label: t('admin', 'jobs'), emoji: '💼', badge: supabaseJobs.length },
    { key: 'listings', label: 'Listings', emoji: '📋', badge: pendingCount },
    { key: 'users', label: t('admin', 'users'), emoji: '👥' },
    { key: 'messages', label: t('admin', 'messages'), emoji: '💬', badge: unreadSupportCount },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{t('admin', 'welcomeBack')}, {user.name} 👋</h1>
          <p className="text-white/40 text-sm mt-0.5">{t('admin', 'title')}</p>
          {listingsLoading && <p className="text-[#00E38C] text-xs mt-1 animate-pulse">Syncing with Supabase…</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/add-listing" className="px-4 py-2 text-sm font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-all flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('nav', 'addListing')}
          </Link>
          <button onClick={() => { logout(); router.push('/'); }} className="px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all flex items-center gap-1.5">
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
            onClick={() => goto(tab.key)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'text-[#050816]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
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
            <StatCard label={t('admin', 'totalUsers')} value={users?.length ?? '…'} emoji="👥" onTab={() => goto('users')} />
            <StatCard label={t('admin', 'totalBusinesses')} value={allBusinesses.length} emoji="🏪" onTab={() => goto('businesses')} />
            <StatCard label={t('admin', 'totalEvents')} value={allEvents.length} emoji="🎉" onTab={() => goto('events')} />
            <StatCard label={t('admin', 'totalHousing')} value={allHousing.length} emoji="🏠" onTab={() => goto('housing')} />
            <StatCard label={t('admin', 'totalJobs')} value={allJobs.length} emoji="💼" onTab={() => goto('jobs')} />
            <StatCard label="Pending Approval" value={pendingCount} emoji="⏳" onTab={() => { setListingFilter('pending'); goto('listings'); }} badge={pendingCount} />
            <StatCard label={t('admin', 'totalMessages')} value={supportMessages.length} emoji="💬" onTab={() => goto('messages')} badge={unreadSupportCount} />
            <StatCard label="Supabase Listings" value={userListings.length} emoji="📋" onTab={() => goto('listings')} />
          </div>

          {/* Recent activity + latest messages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white">{t('admin', 'recentActivity')}</h3>
                {pendingCount > 0 && (
                  <button onClick={() => { setListingFilter('pending'); goto('listings'); }} className="text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
                    {pendingCount} pending →
                  </button>
                )}
              </div>
              {userListings.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No listings yet</p>
              ) : (
                <div className="space-y-3">
                  {userListings.slice(0, 8).map((l, i) => {
                    const title = ('name' in l.data ? l.data.name as string : '') || ('title' in l.data ? l.data.title as string : '') || 'Untitled';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xl">{typeEmoji(l.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{title}</p>
                          <p className="text-xs text-white/30">{l.data.city}, {l.data.state}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={l.status} />
                          <span className="text-xs text-white/20">{new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="glass border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white">{t('admin', 'latestMessages')}</h3>
                <button onClick={() => goto('messages')} className="text-xs font-semibold text-[#00E38C] hover:text-[#00C2FF] transition-colors">View all →</button>
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

      {/* ── Businesses ── */}
      {activeTab === 'businesses' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allBusinesses.length} {t('admin', 'businesses')}</h3>
              <p className="text-xs text-white/30 mt-0.5">{BUSINESSES.length} seed · <span className="text-[#00E38C]">{supabaseBusinesses.length} from Supabase</span></p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div> : (
            <DataTable columns={['Name', 'Category', 'City', 'Rating', 'Status', 'Source']} rows={allBusinesses.map((b) => {
              const isDb = !BUSINESSES.find((x) => x.id === b.id);
              return [
                <span key="n" className="font-semibold text-white">{b.name}</span>,
                b.category, `${b.city}, ${b.state}`,
                <span key="r">⭐ {b.rating}</span>,
                <span key="s" className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.isOpen ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{b.isOpen ? 'Open' : 'Closed'}</span>,
                <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
              ];
            })} />
          )}
        </div>
      )}

      {/* ── Events ── */}
      {activeTab === 'events' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allEvents.length} {t('admin', 'events')}</h3>
              <p className="text-xs text-white/30 mt-0.5">{EVENTS.length} seed · <span className="text-[#00E38C]">{supabaseEvents.length} from Supabase</span></p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div> : (
            <DataTable columns={['Title', 'Organizer', 'Date', 'City', 'Price', 'Source']} rows={allEvents.map((e) => {
              const isDb = !EVENTS.find((x) => x.id === e.id);
              return [
                <span key="t" className="font-semibold text-white">{e.title}</span>,
                e.organizer, new Date(e.date).toLocaleDateString(), `${e.city}, ${e.state}`,
                e.isFree ? <span key="f" className="text-xs font-bold text-[#00E38C]">Free</span> : `$${e.price}`,
                <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
              ];
            })} />
          )}
        </div>
      )}

      {/* ── Housing ── */}
      {activeTab === 'housing' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allHousing.length} {t('admin', 'housing')}</h3>
              <p className="text-xs text-white/30 mt-0.5">{HOUSING.length} seed · <span className="text-[#00E38C]">{supabaseHousing.length} from Supabase</span></p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div> : (
            <DataTable columns={['Title', 'Type', 'Price', 'City', 'Available', 'Source']} rows={allHousing.map((h) => {
              const isDb = !HOUSING.find((x) => x.id === h.id);
              return [
                <span key="t" className="font-semibold text-white">{h.title}</span>,
                `${h.propertyType} (${h.listingType})`,
                `$${h.price.toLocaleString()}${h.listingType === 'rent' ? '/mo' : ''}`,
                `${h.city}, ${h.state}`,
                <span key="a" className={`text-xs font-bold px-2 py-0.5 rounded-full ${h.available ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{h.available ? 'Available' : 'Taken'}</span>,
                <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
              ];
            })} />
          )}
        </div>
      )}

      {/* ── Jobs ── */}
      {activeTab === 'jobs' && (
        <div className="glass border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h3 className="font-black text-white">{allJobs.length} {t('admin', 'jobs')}</h3>
              <p className="text-xs text-white/30 mt-0.5">{JOBS.length} seed · <span className="text-[#00E38C]">{supabaseJobs.length} from Supabase</span></p>
            </div>
            <Link href="/add-listing" className="px-3 py-1.5 text-[#050816] text-xs font-bold rounded-xl" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>+ Add</Link>
          </div>
          {listingsLoading ? <div className="text-center py-10 text-white/30 text-sm animate-pulse">Loading from Supabase…</div> : (
            <DataTable columns={['Title', 'Company', 'Type', 'Salary', 'City', 'Source']} rows={allJobs.map((j) => {
              const isDb = !JOBS.find((x) => x.id === j.id);
              return [
                <span key="t" className="font-semibold text-white">{j.title}</span>,
                j.company, j.jobType, j.salary, `${j.city}, ${j.state}`,
                <span key="src" className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDb ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>{isDb ? 'DB' : 'Seed'}</span>,
              ];
            })} />
          )}
        </div>
      )}

      {/* ── Listings (all user-submitted with approval flow) ── */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-white/40">Filter:</span>
            {(['all', 'pending', 'active', 'rejected'] as ListingFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setListingFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${listingFilter === f ? 'text-[#050816]' : 'text-white/40 border border-white/10 hover:border-white/20'}`}
                style={listingFilter === f ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
              </button>
            ))}
            {listingsLoading && <span className="text-[#00E38C] text-xs animate-pulse ml-auto">Syncing…</span>}
          </div>

          <div className="glass border border-white/8 rounded-2xl">
            <div className="px-5 py-4 border-b border-white/8">
              <h3 className="font-black text-white">
                {filteredListings.length} {listingFilter === 'all' ? 'Total' : listingFilter.charAt(0).toUpperCase() + listingFilter.slice(1)} Listings
              </h3>
            </div>
            {filteredListings.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-white/30">{listingsLoading ? 'Loading from Supabase…' : `No ${listingFilter === 'all' ? '' : listingFilter + ' '}listings.`}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredListings.map((listing) => {
                  const title = ('name' in listing.data ? listing.data.name as string : '') || ('title' in listing.data ? listing.data.title as string : '') || 'Untitled';
                  return (
                    <div key={listing.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.2)' }}>
                        {typeEmoji(listing.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{title}</p>
                        <p className="text-xs text-white/40">{listing.publishedByName || listing.publishedBy || 'Admin'} · {listing.data.city}, {listing.data.state}</p>
                        <p className="text-xs text-white/20">{new Date(listing.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
                        <StatusBadge status={listing.status} />
                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveListing(listing.id)}
                              className="px-2.5 py-1 text-xs font-bold text-[#00E38C] border border-[#00E38C]/30 rounded-lg hover:bg-[#00E38C]/10 transition-colors"
                            >Approve</button>
                            <button
                              onClick={() => rejectListing(listing.id)}
                              className="px-2.5 py-1 text-xs font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                            >Reject</button>
                          </>
                        )}
                        {listing.status === 'rejected' && (
                          <button
                            onClick={() => approveListing(listing.id)}
                            className="px-2.5 py-1 text-xs font-bold text-[#00E38C] border border-[#00E38C]/30 rounded-lg hover:bg-[#00E38C]/10 transition-colors"
                          >Re-approve</button>
                        )}
                        {listing.status === 'active' && (
                          <button
                            onClick={() => rejectListing(listing.id)}
                            className="px-2.5 py-1 text-xs font-bold text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition-colors"
                          >Suspend</button>
                        )}
                        <button onClick={() => deleteListing(listing.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete permanently">
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
        </div>
      )}

      {/* ── Users ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search + filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="glass-input w-full pl-9 pr-4 py-2 rounded-xl text-sm"
              />
            </div>
            {(['all', 'user', 'admin'] as UserRoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setUserRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${userRoleFilter === r ? 'text-[#050816]' : 'text-white/40 border border-white/10 hover:border-white/20'}`}
                style={userRoleFilter === r ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div className="glass border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-black text-white">
                {usersLoading ? 'Loading…' : `${filteredUsers.length} User${filteredUsers.length !== 1 ? 's' : ''}`}
              </h3>
              <button onClick={() => setUsers(null)} className="text-xs text-white/30 hover:text-white/60 transition-colors">↻ Refresh</button>
            </div>
            {usersLoading ? (
              <div className="text-center py-16 animate-pulse text-white/30 text-sm">Fetching from Supabase…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-white/30">{users === null ? 'Loading…' : 'No users found.'}</p>
              </div>
            ) : (
              <DataTable
                columns={['User', 'Email', 'Role', 'Status', 'Joined', 'Last Sign In']}
                rows={filteredUsers.map((u) => [
                  <div key="u" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#050816] text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white truncate max-w-[120px]">{u.name}</span>
                  </div>,
                  <span key="e" className="text-white/50 text-xs">{u.email}</span>,
                  <span key="r" className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'text-[#050816]' : 'bg-white/10 text-white/60 border border-white/10'}`}
                    style={u.role === 'admin' ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}>
                    {u.role}
                  </span>,
                  <span key="s" className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.emailConfirmed ? 'bg-[#00E38C]/10 text-[#00E38C] border border-[#00E38C]/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                    {u.emailConfirmed ? 'Verified' : 'Unverified'}
                  </span>,
                  <span key="c" className="text-white/30 text-xs">{new Date(u.createdAt).toLocaleDateString()}</span>,
                  <span key="l" className="text-white/30 text-xs">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString() : '—'}</span>,
                ])}
              />
            )}
          </div>
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
            <Link href="/admin/messages" className="px-4 py-2 text-[#050816] text-sm font-bold rounded-xl transition-all"
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
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{msg.fromUserName}</span>
                          {!msg.read && <span className="bg-[#00E38C] text-[#050816] text-[10px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                        </div>
                        <span className="text-xs text-white/20">{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">{msg.fromUserEmail}</p>
                      {msg.subject && <p className="text-xs font-semibold text-white/50 mt-1">Subject: {msg.subject}</p>}
                      <p className="text-sm text-white/70 mt-2">{msg.content}</p>
                    </div>
                  </div>

                  {/* Reply textarea */}
                  {replyTarget === msg.id && (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${msg.fromUserName}…`}
                        className="glass-input w-full px-3 py-2 rounded-xl text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply({ id: msg.id, fromUserEmail: msg.fromUserEmail, fromUserName: msg.fromUserName })}
                          disabled={replying || !replyText.trim()}
                          className="px-4 py-1.5 text-[#050816] text-xs font-bold rounded-xl disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
                        >
                          {replying ? 'Sending…' : 'Send Reply'}
                        </button>
                        <button onClick={() => { setReplyTarget(null); setReplyText(''); }} className="px-3 py-1.5 text-xs font-semibold text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {!msg.read && (
                      <button onClick={() => markSupportMessageRead(msg.id)} className="px-3 py-1.5 text-xs font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-colors">
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => { setReplyTarget(replyTarget === msg.id ? null : msg.id); setReplyText(''); }}
                      className="px-3 py-1.5 text-xs font-semibold text-white/50 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                    >
                      {replyTarget === msg.id ? 'Close' : '↩ Reply'}
                    </button>
                    <button onClick={() => deleteSupportMessage(msg.id)} className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors ml-auto">
                      Delete
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
