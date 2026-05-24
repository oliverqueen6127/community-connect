'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';
import { UserMessage } from '@/lib/types';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MessageThread({
  messages,
  currentUserId,
  onReply,
  onMarkRead,
}: {
  messages: UserMessage[];
  currentUserId: string;
  onReply: (toId: string, toName: string, toEmail: string, listingId?: string, listingTitle?: string, listingType?: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const { t } = useLanguage();

  React.useEffect(() => {
    messages.forEach((m) => { if (!m.read && m.toUserId === currentUserId) onMarkRead(m.id); });
  }, [messages, currentUserId, onMarkRead]);

  const sorted = [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const last = sorted[sorted.length - 1];
  const other = last.fromUserId === currentUserId
    ? { id: last.toUserId, name: last.toUserName, email: last.toUserEmail }
    : { id: last.fromUserId, name: last.fromUserName, email: last.fromUserEmail };

  return (
    <div className="glass-card rounded-2xl border border-white/8 hover:border-[#00E38C]/30 overflow-hidden">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#050816] text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}>
          {other.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{other.name}</p>
          {last.listingTitle && (
            <p className="text-xs text-white/30 truncate">{t('messages', 'regarding')}: {last.listingTitle}</p>
          )}
        </div>
        <span className="text-xs text-white/30">{formatDate(last.timestamp)}</span>
      </div>

      {/* Messages */}
      <div className="px-5 py-4 space-y-3 max-h-60 overflow-y-auto">
        {sorted.map((msg) => {
          const isMe = msg.fromUserId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                isMe
                  ? 'rounded-br-sm text-white'
                  : 'rounded-bl-sm text-white/70 bg-white/5 border border-white/8'
              }`}
              style={isMe ? { background: 'linear-gradient(135deg, rgba(0,227,140,0.2), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.25)' } : {}}>
                {msg.content}
                <div className={`text-[10px] mt-1 ${isMe ? 'text-white/40' : 'text-white/20'}`}>
                  {formatDate(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply */}
      <div className="px-5 py-3 border-t border-white/8">
        <button
          onClick={() => onReply(other.id, other.name, other.email, last.listingId, last.listingTitle, last.listingType)}
          className="w-full py-2 text-sm font-semibold border border-white/15 rounded-xl text-white/50 hover:text-[#00E38C] hover:border-[#00E38C]/40 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          {t('messages', 'reply')}
        </button>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user, isLoading } = useApp();
  const { userMessages, sendUserMessage, markUserMessageRead } = useMessages();
  const { t } = useLanguage();
  const router = useRouter();

  const [replyTo, setReplyTo] = useState<{
    toId: string; toName: string; toEmail: string;
    listingId?: string; listingTitle?: string; listingType?: string;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login?redirect=/messages');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const relevant = userMessages.filter((m) => m.fromUserId === user.id || m.toUserId === user.id);

  const threads = new Map<string, UserMessage[]>();
  relevant.forEach((msg) => {
    const participants = [msg.fromUserId, msg.toUserId].sort().join('-');
    const key = `${participants}-${msg.listingId || 'general'}`;
    if (!threads.has(key)) threads.set(key, []);
    threads.get(key)!.push(msg);
  });

  const threadEntries = Array.from(threads.entries()).sort((a, b) => {
    const lastA = Math.max(...a[1].map((m) => new Date(m.timestamp).getTime()));
    const lastB = Math.max(...b[1].map((m) => new Date(m.timestamp).getTime()));
    return lastB - lastA;
  });

  const handleReply = async () => {
    if (!replyText.trim() || !replyTo) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 400));
    sendUserMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserEmail: user.email,
      toUserId: replyTo.toId,
      toUserName: replyTo.toName,
      toUserEmail: replyTo.toEmail,
      listingId: replyTo.listingId,
      listingTitle: replyTo.listingTitle,
      listingType: replyTo.listingType,
      content: replyText.trim(),
    });
    setReplyText('');
    setReplyTo(null);
    setSending(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{t('messages', 'title')}</h1>
        <p className="text-white/40 mt-1">{t('messages', 'inbox')}</p>
      </div>

      {threadEntries.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-white/8">
          <div className="text-6xl mb-4" style={{ animation: 'float 3s ease-in-out infinite' }}>💬</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('messages', 'noMessages')}</h3>
          <p className="text-white/30 max-w-xs mx-auto">{t('messages', 'noMessagesDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threadEntries.map(([key, msgs]) => (
            <MessageThread
              key={key}
              messages={msgs}
              currentUserId={user.id}
              onReply={(toId, toName, toEmail, listingId, listingTitle, listingType) =>
                setReplyTo({ toId, toName, toEmail, listingId, listingTitle, listingType })
              }
              onMarkRead={markUserMessageRead}
            />
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyTo && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setReplyTo(null)}>
          <div className="glass border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white">{t('messages', 'reply')} to {replyTo.toName}</h3>
              <button onClick={() => setReplyTo(null)} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {replyTo.listingTitle && (
              <div className="glass border border-[#00E38C]/20 rounded-xl px-4 py-2 mb-4">
                <p className="text-xs text-white/30">{t('messages', 'regarding')}: <span className="font-semibold text-[#00E38C]">{replyTo.listingTitle}</span></p>
              </div>
            )}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('messages', 'replyPlaceholder')}
              rows={4}
              autoFocus
              className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReplyTo(null)} className="flex-1 py-3 border border-white/15 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-colors">{t('common', 'cancel')}</button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="flex-1 py-3 text-[#050816] rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,227,140,0.3)]"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
              >
                {sending ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : null}
                {t('messages', 'sendReply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
