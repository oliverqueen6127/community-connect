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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {other.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{other.name}</p>
          {last.listingTitle && (
            <p className="text-xs text-gray-400 truncate">{t('messages', 'regarding')}: {last.listingTitle}</p>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatDate(last.timestamp)}</span>
      </div>

      {/* Messages */}
      <div className="px-5 py-4 space-y-3 max-h-60 overflow-y-auto">
        {sorted.map((msg) => {
          const isMe = msg.fromUserId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                isMe
                  ? 'bg-[#1B4332] text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {msg.content}
                <div className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatDate(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply */}
      <div className="px-5 py-3 border-t border-gray-50">
        <button
          onClick={() => onReply(other.id, other.name, other.email, last.listingId, last.listingTitle, last.listingType)}
          className="w-full py-2 text-sm font-semibold text-[#1B4332] border border-[#1B4332] rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors flex items-center justify-center gap-2"
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
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#52B788] animate-pulse" />
      </div>
    );
  }

  // Group messages by "conversation" (listing + other user)
  const relevant = userMessages.filter(
    (m) => m.fromUserId === user.id || m.toUserId === user.id
  );

  // Group by conversation key: sort the two user IDs + listingId
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('messages', 'title')}</h1>
          <p className="text-gray-500 mt-1">{t('messages', 'inbox')}</p>
        </div>
      </div>

      {threadEntries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">{t('messages', 'noMessages')}</h3>
          <p className="text-gray-400 max-w-xs mx-auto">{t('messages', 'noMessagesDesc')}</p>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setReplyTo(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">{t('messages', 'reply')} to {replyTo.toName}</h3>
              <button onClick={() => setReplyTo(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {replyTo.listingTitle && (
              <div className="bg-[#1B4332]/5 rounded-xl px-4 py-2 mb-4">
                <p className="text-xs text-gray-500">{t('messages', 'regarding')}: <span className="font-semibold text-[#1B4332]">{replyTo.listingTitle}</span></p>
              </div>
            )}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('messages', 'replyPlaceholder')}
              rows={4}
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] focus:ring-2 focus:ring-[#52B788]/20 text-sm text-gray-800 resize-none bg-gray-50 focus:bg-white transition-all mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReplyTo(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">{t('common', 'cancel')}</button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="flex-1 py-3 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
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
