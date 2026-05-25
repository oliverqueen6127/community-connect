'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SupportMessage, SupportReply } from '@/lib/types';

interface SupportMessengerProps {
  conversation: SupportMessage;
  replies: SupportReply[];
  currentRole: 'admin' | 'user';
  onSend: (text: string) => Promise<void>;
  onClose?: () => void;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffH = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  if (diffH < 24) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Bubble {
  id: string;
  senderRole: 'admin' | 'user';
  senderName: string;
  message: string;
  createdAt: string;
}

export default function SupportMessenger({
  conversation,
  replies,
  currentRole,
  onSend,
  onClose,
  onMarkRead,
  onDelete,
}: SupportMessengerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length, conversation.id]);

  // Reset text when conversation changes
  useEffect(() => {
    setText('');
  }, [conversation.id]);

  const bubbles: Bubble[] = [
    {
      id: `init-${conversation.id}`,
      senderRole: 'user' as const,
      senderName: conversation.fromUserName,
      message: conversation.content,
      createdAt: conversation.timestamp,
    },
    ...replies.map((r): Bubble => ({
      id: r.id,
      senderRole: r.senderRole,
      senderName: r.senderName,
      message: r.message,
      createdAt: r.createdAt,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  }, [text, sending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll the input into view when focused (mobile keyboard pushes it up)
  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 350);
  };

  return (
    <div className="flex flex-col w-full" style={{ height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#050816] text-sm font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
        >
          {conversation.fromUserName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{conversation.fromUserName}</p>
          <p className="text-xs text-white/30 truncate">{conversation.fromUserEmail}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onMarkRead && !conversation.read && (
            <button
              onClick={onMarkRead}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#00E38C] border border-[#00E38C]/30 rounded-xl hover:bg-[#00E38C]/10 transition-colors"
            >
              Mark Read
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              title="Delete conversation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Subject bar */}
      {conversation.subject && (
        <div
          className="px-4 py-2 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-white/30 truncate">
            Re: <span className="text-white/50 font-medium">{conversation.subject}</span>
          </p>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: 0, overscrollBehavior: 'contain' }}
      >
        <div className="space-y-3">
          {bubbles.map((bubble) => {
            const isMe = bubble.senderRole === currentRole;
            return (
              <div key={bubble.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`} style={{ maxWidth: '78%' }}>
                  {!isMe && (
                    <span className="text-[10px] font-semibold text-white/40 px-1">{bubble.senderName}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe ? 'text-[#050816] rounded-tr-sm' : 'text-white/85 rounded-tl-sm'
                    }`}
                    style={
                      isMe
                        ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }
                        : { background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {bubble.message}
                  </div>
                  <span className="text-[10px] text-white/20 px-1">{formatTime(bubble.createdAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-3 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
            }}
            placeholder={`Message ${currentRole === 'admin' ? conversation.fromUserName : 'Support'}…`}
            rows={1}
            className="flex-1 px-3 py-2.5 rounded-2xl text-sm text-white placeholder-white/25 focus:outline-none resize-none leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: text ? '1px solid rgba(0,227,140,0.35)' : '1px solid rgba(255,255,255,0.1)',
              maxHeight: '100px',
              minHeight: '40px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
            style={
              text.trim() && !sending
                ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }
                : { background: 'rgba(255,255,255,0.08)' }
            }
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className={`w-4 h-4 ${text.trim() ? 'text-[#050816]' : 'text-white/30'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-white/15 mt-1.5 pl-1 hidden sm:block">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
