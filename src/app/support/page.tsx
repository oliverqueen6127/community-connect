'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';

export default function SupportPage() {
  const { user, addToast } = useApp();
  const { sendSupportMessage } = useMessages();
  const { t } = useLanguage();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setSending(true);
    try {
      await sendSupportMessage({
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserEmail: user.email,
        subject: subject.trim() || undefined,
        content: message.trim(),
        page: '/support',
      });
      addToast({ type: 'success', message: t('supportPage', 'sent') });
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast({ type: 'error', message: `Failed to send: ${msg}` });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 flex flex-col items-center gap-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.25)' }}
        >
          <svg className="w-8 h-8 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-white mb-2">{t('supportPage', 'title')}</h1>
          <p className="text-white/50">{t('supportPage', 'loginRequired')}</p>
        </div>
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded-xl font-bold text-[#050816]"
          style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
        >
          {t('supportPage', 'loginBtn')}
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 flex flex-col items-center gap-6 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.2), rgba(0,194,255,0.2))', border: '1px solid rgba(0,227,140,0.4)', boxShadow: '0 0 30px rgba(0,227,140,0.2)' }}
        >
          <svg className="w-8 h-8 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-2">{t('supportPage', 'sent')}</h2>
          <p className="text-white/50">{t('supportPage', 'subtitle')}</p>
        </div>
        <button
          onClick={() => { setSent(false); setSubject(''); setMessage(''); }}
          className="px-6 py-3 rounded-xl font-semibold text-sm border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-all"
        >
          {t('supportPage', 'send')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,227,140,0.15), rgba(0,194,255,0.15))', border: '1px solid rgba(0,227,140,0.25)' }}
          >
            <svg className="w-5 h-5 text-[#00E38C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{t('supportPage', 'title')}</h1>
            <p className="text-white/40 text-sm">{t('supportPage', 'subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
        >
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-2">
              {t('supportPage', 'subject')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('supportPage', 'subjectPlaceholder')}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: subject ? '1px solid rgba(0,227,140,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-2">
              {t('supportPage', 'message')} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('supportPage', 'messagePlaceholder')}
              rows={6}
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition-all resize-none leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: message ? '1px solid rgba(0,227,140,0.4)' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* From */}
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: 'rgba(0,227,140,0.06)', border: '1px solid rgba(0,227,140,0.15)' }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#050816] flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
            >
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-white/40">{user.email}</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={
            message.trim() && !sending
              ? { background: 'linear-gradient(135deg, #00E38C, #00C2FF)', color: '#050816', boxShadow: '0 0 20px rgba(0,227,140,0.3)' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
          }
        >
          {sending ? t('supportPage', 'sending') : t('supportPage', 'send')}
        </button>
      </form>
    </div>
  );
}
