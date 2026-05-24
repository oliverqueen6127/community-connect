'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';

export default function SupportChat() {
  const { user, addToast } = useApp();
  const { sendSupportMessage } = useMessages();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && user) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [open, user]);

  if (pathname.startsWith('/admin')) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 500));
    sendSupportMessage({
      fromUserId: user?.id,
      fromUserName: user?.name ?? 'Anonymous',
      fromUserEmail: user?.email ?? '',
      content: message.trim(),
      page: pathname,
    });
    addToast({ type: 'success', message: t('support', 'messageSent') });
    setSending(false);
    setSent(true);
    setMessage('');
    setTimeout(() => { setSent(false); setOpen(false); }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #00E38C, #00C2FF)',
          boxShadow: open ? '0 0 30px rgba(0,227,140,0.5)' : '0 0 20px rgba(0,227,140,0.3)',
        }}
        aria-label={t('support', 'title')}
      >
        {open ? (
          <svg className="w-6 h-6 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-40 right-4 lg:bottom-24 lg:right-6 z-40 w-80 glass border border-white/15 rounded-3xl overflow-hidden shadow-2xl"
          style={{ animation: 'slideUp 0.25s ease', boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,227,140,0.1)' }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.1), rgba(0,194,255,0.08))' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)', boxShadow: '0 0 12px rgba(0,227,140,0.4)' }}>
                <svg className="w-5 h-5 text-[#050816]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{t('support', 'title')}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E38C] animate-pulse" />
                  <p className="text-white/40 text-xs">Community Connect</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {sent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-sm font-bold text-[#00E38C]">{t('support', 'messageSent')}</p>
              </div>
            ) : !user ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-sm font-semibold text-white/70 mb-1">{t('support', 'loginRequired')}</p>
                <button
                  onClick={() => { setOpen(false); router.push('/auth/login'); }}
                  className="mt-3 px-4 py-2 text-[#050816] text-sm font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(0,227,140,0.3)]"
                  style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
                >
                  {t('support', 'loginBtn')}
                </button>
              </div>
            ) : (
              <>
                <div className="glass border border-white/8 rounded-2xl p-3 mb-4">
                  <p className="text-sm font-bold text-white">{t('support', 'greeting')}</p>
                  <p className="text-xs text-white/40 mt-1">{t('support', 'subGreeting')}</p>
                </div>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('support', 'placeholder')}
                  rows={3}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="mt-3 w-full py-2.5 text-[#050816] rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,227,140,0.3)]"
                  style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  {t('support', 'send')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
