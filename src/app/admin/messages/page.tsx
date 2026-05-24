'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminMessagesPage() {
  const { user, isLoading } = useApp();
  const { supportMessages, markSupportMessageRead, deleteSupportMessage } = useMessages();
  const { t } = useLanguage();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login?redirect=/admin/messages');
      else if (user.role !== 'admin') router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const filtered = supportMessages.filter((m) =>
    filter === 'all' ? true : filter === 'unread' ? !m.read : m.read
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = supportMessages.filter((m) => !m.read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 rounded-xl glass border border-white/10 hover:border-[#00E38C]/40 transition-all text-white/40 hover:text-[#00E38C]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">{t('admin', 'messages')}</h1>
          <p className="text-white/40 text-sm mt-0.5">Support messages from users</p>
        </div>
        {unreadCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {unreadCount} {t('messages', 'unread')}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f ? 'text-[#050816]' : 'glass border border-white/10 text-white/40 hover:text-white hover:border-white/20'
            }`}
            style={filter === f ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' } : {}}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-black/15 text-[#050816]' : 'bg-red-500 text-white'}`}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/8">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-bold text-white mb-2">No messages</h3>
          <p className="text-white/30">No support messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`glass-card rounded-2xl border p-5 transition-all ${
                !msg.read ? 'border-[#00E38C]/30' : 'border-white/8'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#050816] text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
                    {msg.fromUserName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{msg.fromUserName}</span>
                      {!msg.read && (
                        <span className="bg-[#00E38C] text-[#050816] text-[10px] font-bold px-2 py-0.5 rounded-full">{t('messages', 'unread')}</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{msg.fromUserEmail}</p>
                    {msg.page && (
                      <p className="text-xs text-white/30">Page: <code className="text-white/50">{msg.page}</code></p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-white/20 flex-shrink-0">{formatDate(msg.timestamp)}</span>
              </div>

              <div className="mt-3 ml-13">
                <p className="text-sm text-white/70 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 leading-relaxed">{msg.content}</p>
              </div>

              <div className="flex gap-2 mt-4">
                {!msg.read && (
                  <button
                    onClick={() => markSupportMessageRead(msg.id)}
                    className="px-4 py-2 text-xs font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('messages', 'markRead')}
                  </button>
                )}
                {deleteConfirm === msg.id ? (
                  <>
                    <span className="text-xs text-white/30 self-center">Confirm delete?</span>
                    <button onClick={() => { deleteSupportMessage(msg.id); setDeleteConfirm(null); }} className="px-4 py-2 text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors">{t('common', 'confirm')}</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-semibold glass border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white/50">{t('common', 'cancel')}</button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(msg.id)}
                    className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('common', 'delete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
