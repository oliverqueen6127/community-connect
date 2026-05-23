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

  // Don't show on admin pages
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
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label={t('support', 'title')}
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-40 right-4 md:bottom-24 md:right-6 z-40 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ animation: 'slideUp 0.25s ease' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1B4332] to-[#2d6a4f] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{t('support', 'title')}</p>
                <p className="text-white/70 text-xs">Community Connect</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {sent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-sm font-bold text-gray-900">{t('support', 'messageSent')}</p>
              </div>
            ) : !user ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-sm font-semibold text-gray-700 mb-1">{t('support', 'loginRequired')}</p>
                <button
                  onClick={() => { setOpen(false); router.push('/auth/login'); }}
                  className="mt-3 px-4 py-2 bg-[#1B4332] text-white text-sm font-bold rounded-xl hover:bg-[#0f2d21] transition-colors"
                >
                  {t('support', 'loginBtn')}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-[#1B4332]/5 rounded-2xl p-3 mb-4">
                  <p className="text-sm font-bold text-gray-900">{t('support', 'greeting')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('support', 'subGreeting')}</p>
                </div>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('support', 'placeholder')}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] focus:ring-2 focus:ring-[#52B788]/20 text-sm text-gray-800 resize-none bg-gray-50 focus:bg-white transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="mt-3 w-full py-2.5 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
