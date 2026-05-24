'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useListings, buildListingData } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { ListingType } from '@/lib/types';
import { US_CITIES } from '@/lib/data';

const TYPE_OPTIONS: { type: ListingType; emoji: string; key: string; descKey: string }[] = [
  { type: 'business', emoji: '🏪', key: 'business', descKey: 'businessDesc' },
  { type: 'event', emoji: '🎉', key: 'event', descKey: 'eventDesc' },
  { type: 'housing', emoji: '🏠', key: 'housing', descKey: 'housingDesc' },
  { type: 'job', emoji: '💼', key: 'job', descKey: 'jobDesc' },
];

const INPUT = 'glass-input w-full px-4 py-3 rounded-xl text-sm';
const LABEL = 'block text-sm font-semibold text-white/60 mb-1.5';
const FIELD = 'mb-4';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className={FIELD}><label className={LABEL}>{label}</label>{children}</div>;
}

export default function AddListingPage() {
  const { user, isLoading, addToast } = useApp();
  const { addListing } = useListings();
  const { t } = useLanguage();
  const router = useRouter();

  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [type, setType] = useState<ListingType>('business');
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) router.push('/auth/login?redirect=/add-listing');
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }} />
      </div>
    );
  }

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const data = buildListingData(type, form, user.id, user.name);
    addListing({
      publishedBy: user.id,
      publishedByName: user.name,
      publishedByEmail: user.email,
      type,
      data,
    });
    addToast({ type: 'success', message: t('addListing', 'listingCreated') });
    setSubmitting(false);
    router.push('/profile');
  };

  const selectStyle = `${INPUT} bg-transparent`;

  if (step === 'choose') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pt-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white mb-2">{t('addListing', 'title')}</h1>
          <p className="text-white/40">{t('addListing', 'chooseType')}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => { setType(opt.type); setStep('form'); }}
              className="group glass-card border border-white/8 hover:border-[#00E38C]/40 p-6 rounded-2xl text-left transition-all duration-300"
            >
              <div className="text-4xl mb-3">{opt.emoji}</div>
              <h3 className="font-black text-white text-lg mb-1">{t('addListing', opt.key)}</h3>
              <p className="text-xs text-white/30">{t('addListing', opt.descKey)}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pt-8">
      <button
        onClick={() => setStep('choose')}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-[#00E38C] mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('nav', 'back')}
      </button>

      <div className="glass border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">
            {TYPE_OPTIONS.find((o) => o.type === type)?.emoji} {t('addListing', type === 'business' ? 'business' : type === 'event' ? 'event' : type === 'housing' ? 'housing' : 'job')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          <Field label={t('addListing', 'formTitle')}>
            <input type="text" className={INPUT} value={form.title || ''} onChange={(e) => set('title', e.target.value)} required
              placeholder={type === 'job' ? 'e.g. Senior Software Engineer' : type === 'event' ? 'e.g. Community Eid Dinner' : type === 'housing' ? 'e.g. Modern 2BR Apartment' : 'e.g. Al-Amir Halal Restaurant'} />
          </Field>

          <Field label={t('common', 'description')}>
            <textarea className={`${INPUT} resize-none`} rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Describe your listing..." />
          </Field>

          {type === 'business' && (
            <>
              <Field label={t('common', 'category')}>
                <select className={selectStyle} value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
                  <option value="" className="bg-[#050816]">Select category</option>
                  {['restaurant', 'grocery', 'mosque', 'school', 'healthcare', 'retail', 'services', 'halal', 'entertainment', 'other'].map((c) => (
                    <option key={c} value={c} className="bg-[#050816]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('common', 'address')}><input type="text" className={INPUT} value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
              <Field label={t('common', 'phone')}><input type="tel" className={INPUT} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
              <Field label={t('common', 'website')}><input type="url" className={INPUT} value={form.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" /></Field>
            </>
          )}

          {type === 'event' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label={t('addListing', 'eventDate')}><input type="date" className={INPUT} value={form.eventDate || ''} onChange={(e) => set('eventDate', e.target.value)} /></Field>
                <Field label={t('addListing', 'eventTime')}><input type="time" className={INPUT} value={form.eventTime || ''} onChange={(e) => set('eventTime', e.target.value)} /></Field>
              </div>
              <Field label={t('addListing', 'location')}><input type="text" className={INPUT} value={form.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Islamic Cultural Center" /></Field>
              <Field label={`${t('common', 'price')} (0 = free)`}><input type="number" min="0" className={INPUT} value={form.price || '0'} onChange={(e) => set('price', e.target.value)} /></Field>
            </>
          )}

          {type === 'housing' && (
            <>
              <Field label={t('addListing', 'propertyType')}>
                <select className={selectStyle} value={form.propertyType || ''} onChange={(e) => set('propertyType', e.target.value)}>
                  {['apartment', 'house', 'condo', 'townhouse', 'studio'].map((p) => <option key={p} value={p} className="bg-[#050816]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </Field>
              <Field label={t('addListing', 'listingType')}>
                <select className={selectStyle} value={form.listingType || 'rent'} onChange={(e) => set('listingType', e.target.value)}>
                  <option value="rent" className="bg-[#050816]">{t('common', 'forRent')}</option>
                  <option value="sale" className="bg-[#050816]">{t('common', 'forSale')}</option>
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label={t('addListing', 'bedrooms')}><input type="number" min="0" className={INPUT} value={form.bedrooms || '1'} onChange={(e) => set('bedrooms', e.target.value)} /></Field>
                <Field label={t('addListing', 'bathrooms')}><input type="number" min="1" step="0.5" className={INPUT} value={form.bathrooms || '1'} onChange={(e) => set('bathrooms', e.target.value)} /></Field>
                <Field label={t('addListing', 'sqft')}><input type="number" min="0" className={INPUT} value={form.sqft || ''} onChange={(e) => set('sqft', e.target.value)} /></Field>
              </div>
              <Field label={`${t('common', 'price')} (${form.listingType === 'sale' ? t('common', 'forSale') : '/mo'})`}><input type="number" min="0" className={INPUT} value={form.price || ''} onChange={(e) => set('price', e.target.value)} /></Field>
              <Field label={t('common', 'address')}><input type="text" className={INPUT} value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
              <Field label={t('common', 'phone')}><input type="tel" className={INPUT} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            </>
          )}

          {type === 'job' && (
            <>
              <Field label={t('addListing', 'company')}><input type="text" className={INPUT} value={form.company || ''} onChange={(e) => set('company', e.target.value)} required /></Field>
              <Field label={t('addListing', 'jobType')}>
                <select className={selectStyle} value={form.jobType || 'full-time'} onChange={(e) => set('jobType', e.target.value)}>
                  {['full-time', 'part-time', 'contract', 'freelance', 'internship'].map((j) => <option key={j} value={j} className="bg-[#050816]">{j}</option>)}
                </select>
              </Field>
              <Field label={t('addListing', 'salary')}><input type="text" className={INPUT} value={form.salary || ''} onChange={(e) => set('salary', e.target.value)} placeholder="e.g. $60k-$80k/yr" /></Field>
              <div className="flex items-center gap-3 mb-4">
                <input type="checkbox" id="remote" checked={form.remote === 'true'} onChange={(e) => set('remote', String(e.target.checked))} className="w-4 h-4 accent-[#00E38C]" />
                <label htmlFor="remote" className="text-sm font-medium text-white/60">{t('common', 'remote')}</label>
              </div>
              <Field label={t('common', 'email')}><input type="email" className={INPUT} value={form.email || user.email} onChange={(e) => set('email', e.target.value)} /></Field>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label={t('common', 'city')}>
              <input list="city-list" type="text" className={INPUT} value={form.city || ''} onChange={(e) => set('city', e.target.value)} placeholder="New York" />
              <datalist id="city-list">
                {US_CITIES.map((c) => <option key={`${c.city}-${c.state}`} value={c.city} />)}
              </datalist>
            </Field>
            <Field label={t('common', 'state')}>
              <input type="text" className={INPUT} value={form.state || ''} onChange={(e) => set('state', e.target.value)} placeholder="NY" maxLength={2} />
            </Field>
          </div>

          <Field label={t('addListing', 'tags')}>
            <input type="text" className={INPUT} value={form.tags || ''} onChange={(e) => set('tags', e.target.value)} placeholder="halal, family-friendly, delivery" />
          </Field>

          <button
            type="submit"
            disabled={submitting || !form.title?.trim()}
            className="w-full py-4 mt-2 text-[#050816] font-bold rounded-2xl transition-all hover:shadow-[0_0_25px_rgba(0,227,140,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
          >
            {submitting ? (
              <><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t('addListing', 'publishing')}</>
            ) : t('addListing', 'publish')}
          </button>
        </form>
      </div>
    </div>
  );
}
