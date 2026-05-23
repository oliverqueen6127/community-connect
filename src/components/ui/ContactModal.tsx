'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useMessages } from '@/lib/messages-context';
import { useLanguage } from '@/lib/language-context';

interface ContactModalProps {
  listingId: string;
  listingTitle: string;
  listingType: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  onClose: () => void;
}

export default function ContactModal({
  listingId, listingTitle, listingType,
  ownerId = '1', ownerName = 'Administrator', ownerEmail = 'admin@communityconnect.local',
  onClose,
}: ContactModalProps) {
  const { user, addToast } = useApp();
  const { sendUserMessage } = useMessages();
  const { t } = useLanguage();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 400));
    sendUserMessage({
      fromUserId: user!.id,
      fromUserName: user!.name,
      fromUserEmail: user!.email,
      toUserId: ownerId,
      toUserName: ownerName,
      toUserEmail: ownerEmail,
      listingId,
      listingTitle,
      listingType,
      content: message.trim(),
    });
    addToast({ type: 'success', message: t('messages', 'messageSent') });
    setSending(false);
    onClose();
    router.push('/messages');
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
          <div className="text-5xl mb-4">🔐</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">{t('auth', 'loginRequired')}</h3>
          <p className="text-gray-500 text-sm mb-6">{t('auth', 'loginToContact')}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">{t('common', 'cancel')}</button>
            <button
              onClick={() => { onClose(); router.push('/auth/login'); }}
              className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-bold hover:bg-[#0f2d21] transition-colors"
            >
              {t('auth', 'signIn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contactLabel = listingType === 'housing' ? t('messages', 'contactOwner')
    : listingType === 'event' ? t('messages', 'contactOrganizer')
    : listingType === 'job' ? t('messages', 'contactEmployer')
    : t('messages', 'contactLister');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-gray-900">{contactLabel}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-[#1B4332]/5 border border-[#52B788]/30 rounded-2xl px-4 py-3 mb-4">
          <p className="text-xs text-gray-500 font-medium">{t('messages', 'regarding')}</p>
          <p className="text-sm font-bold text-[#1B4332] mt-0.5 line-clamp-1">{listingTitle}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('messages', 'yourMessage')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('messages', 'writeMessage')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#52B788] focus:ring-2 focus:ring-[#52B788]/20 text-gray-800 text-sm resize-none bg-gray-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">{t('common', 'cancel')}</button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 py-3 bg-gradient-to-r from-[#1B4332] to-[#52B788] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t('common', 'loading')}</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> {t('common', 'send')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
