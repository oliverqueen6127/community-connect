'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { useListings, buildListingData } from '@/lib/listings-context';
import { useLanguage } from '@/lib/language-context';
import { ListingType } from '@/lib/types';
import { US_CITIES } from '@/lib/data';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Please select an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'error', message: 'Image must be under 5 MB.' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File, userId: string): Promise<string> => {
    if (!isSupabaseEnabled || !supabase) throw new Error('Supabase storage is not configured');
    console.log('IMAGE FILE', { name: file.name, size: file.size, type: file.type });
    const path = `listings/${userId}/${Date.now()}-${file.name}`;
    console.log('UPLOAD PATH', path);
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      console.error('UPLOAD ERROR', error.message, error);
      throw new Error(error.message);
    }
    console.log('UPLOAD DATA', data);
    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(data.path);
    console.log('PUBLIC URL', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const uploadImageAdmin = async (file: File): Promise<string> => {
    console.log('IMAGE FILE (admin)', { name: file.name, size: file.size, type: file.type });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'mock-admin-1');
    formData.append('fileName', file.name);
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    const json = await res.json() as { publicUrl?: string; error?: string };
    if (!res.ok || json.error) {
      console.error('UPLOAD ERROR (admin)', json.error);
      throw new Error(json.error ?? 'Upload failed');
    }
    console.log('PUBLIC URL (admin)', json.publicUrl);
    return json.publicUrl!;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setSubmitting(true);

    console.log('CURRENT USER', user);
    console.log('USER ID', user?.id);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = user.id === 'mock-admin-1'
            ? await uploadImageAdmin(imageFile)
            : await uploadImage(imageFile, user.id);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          addToast({ type: 'error', message: `Image upload failed: ${msg}` });
          setUploading(false);
          setSubmitting(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const listingData = buildListingData(type, form, user.id, user.name, imageUrl);
      console.log('TABLE', type === 'business' ? 'businesses' : type === 'event' ? 'events' : type === 'housing' ? 'housing' : 'jobs');
      console.log('PAYLOAD (frontend object)', listingData);

      await addListing({
        publishedBy: user.id,
        publishedByName: user.name,
        publishedByEmail: user.email,
        type,
        data: listingData,
      });

      const isAdmin = user.id === 'mock-admin-1';
      addToast({ type: 'success', message: isAdmin ? t('addListing', 'listingCreated') : 'Listing submitted! It will appear after admin approval.' });
      router.push('/profile');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AddListing] FAILED:', msg);
      // Show the real Supabase error in the UI so the user can report it
      addToast({ type: 'error', message: `Listing not saved: ${msg}` });
    } finally {
      setSubmitting(false);
    }
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

          {/* ── Cover photo upload ── */}
          <div className="mb-6">
            <label className={LABEL}>Cover Photo <span className="text-white/20 font-normal">(optional · max 5 MB)</span></label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden h-40 bg-white/5 border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#00E38C]/40 transition-colors flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Click to upload cover photo</span>
              </button>
            )}
          </div>

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
            disabled={submitting || uploading || !form.title?.trim()}
            className="w-full py-4 mt-2 text-[#050816] font-bold rounded-2xl transition-all hover:shadow-[0_0_25px_rgba(0,227,140,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            style={{ background: 'linear-gradient(135deg, #00E38C, #00C2FF)' }}
          >
            {uploading ? (
              <><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Uploading image…</>
            ) : submitting ? (
              <><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t('addListing', 'publishing')}</>
            ) : t('addListing', 'publish')}
          </button>
        </form>
      </div>
    </div>
  );
}
