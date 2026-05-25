'use client';

import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import { UserListing, ListingType, Business, Event, Housing, Job } from './types';
import { supabase, isSupabaseEnabled } from './supabase';
import { useApp } from './context';

const LISTINGS_KEY = 'cc-user-listings';

interface ListingsContextType {
  userListings: UserListing[];
  addListing: (listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  deleteListing: (id: string) => void;
  approveListing: (id: string) => void;
  rejectListing: (id: string) => void;
  getListingsByUser: (userId: string) => UserListing[];
  activeListings: UserListing[];
  isLoading: boolean;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

type DbTable = 'businesses' | 'events' | 'housing' | 'jobs';

function getTable(type: ListingType): DbTable {
  return type === 'business' ? 'businesses'
    : type === 'event' ? 'events'
    : type === 'housing' ? 'housing'
    : 'jobs';
}

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ul-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Row → TypeScript types ─────────────────────────────────────────────────────

function rowToData(row: Record<string, unknown>, type: ListingType): Business | Event | Housing | Job {
  const id = row.id as string;

  if (type === 'business') {
    return {
      id, type: 'business',
      name: (row.name as string) || '',
      category: (row.category as Business['category']) || 'other',
      description: (row.description as string) || '',
      address: (row.address as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      zip: (row.zip as string) || '',
      phone: (row.phone as string) || '',
      website: (row.website as string) || undefined,
      rating: (row.rating as number) || 0,
      reviewCount: (row.review_count as number) || 0,
      isOpen: Boolean(row.is_open),
      hours: (row.hours as string) || '',
      image: (row.image_url as string) || '',
      tags: (row.tags as string[]) || [],
      priceLevel: ((row.price_level as number) || 2) as 1 | 2 | 3 | 4,
    };
  }

  if (type === 'event') {
    return {
      id, type: 'event',
      title: (row.title as string) || '',
      description: (row.description as string) || '',
      category: (row.category as string) || 'community',
      date: (row.date as string) || '',
      time: (row.time as string) || '',
      endTime: (row.end_time as string) || undefined,
      location: (row.location as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      organizer: (row.organizer as string) || '',
      attendees: (row.attendees as number) || 0,
      maxAttendees: (row.max_attendees as number) || undefined,
      price: (row.price as number) || 0,
      isFree: Boolean(row.is_free),
      image: (row.image_url as string) || '',
      tags: (row.tags as string[]) || [],
      rsvpLink: (row.rsvp_link as string) || undefined,
    };
  }

  if (type === 'housing') {
    return {
      id, type: 'housing',
      title: (row.title as string) || '',
      description: (row.description as string) || '',
      address: (row.address as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      zip: (row.zip as string) || '',
      price: (row.price as number) || 0,
      bedrooms: (row.bedrooms as number) || 1,
      bathrooms: (row.bathrooms as number) || 1,
      sqft: (row.sqft as number) || 0,
      propertyType: (row.property_type as Housing['propertyType']) || 'apartment',
      listingType: (row.listing_type as Housing['listingType']) || 'rent',
      images: (row.images as string[]) || [],
      amenities: (row.amenities as string[]) || [],
      contactName: (row.contact_name as string) || '',
      contactPhone: (row.contact_phone as string) || '',
      contactEmail: (row.contact_email as string) || '',
      postedDate: new Date((row.created_at as string) || Date.now()).toISOString().split('T')[0],
      available: Boolean(row.available),
      petFriendly: Boolean(row.pet_friendly),
      parking: Boolean(row.parking),
    };
  }

  return {
    id, type: 'job',
    title: (row.title as string) || '',
    company: (row.company as string) || '',
    description: (row.description as string) || '',
    category: (row.category as string) || 'general',
    city: (row.city as string) || '',
    state: (row.state as string) || '',
    salary: (row.salary as string) || '',
    jobType: (row.job_type as Job['jobType']) || 'full-time',
    remote: Boolean(row.remote),
    experience: (row.experience as string) || '',
    requirements: (row.requirements as string[]) || [],
    benefits: (row.benefits as string[]) || [],
    contactEmail: (row.contact_email as string) || '',
    postedDate: new Date((row.created_at as string) || Date.now()).toISOString().split('T')[0],
    deadline: (row.deadline as string) || undefined,
    logo: (row.logo_url as string) || undefined,
  };
}

function rowToUserListing(row: Record<string, unknown>, type: ListingType): UserListing {
  return {
    id: row.id as string,
    publishedBy: (row.owner_id as string) || '',
    publishedByName: '',
    publishedByEmail: '',
    type,
    data: rowToData(row, type),
    createdAt: (row.created_at as string) || new Date().toISOString(),
    status: (row.status as string) === 'active' ? 'active' : 'pending',
  };
}

// ── TypeScript types → DB row ─────────────────────────────────────────────────

function listingToDbRow(id: string, listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>): Record<string, unknown> {
  const { data, type, publishedBy } = listing;
  const base = { id, owner_id: publishedBy.startsWith('mock-') ? null : publishedBy, city: data.city, state: data.state, status: 'active' };

  if (type === 'business') {
    const b = data as Business;
    return {
      ...base,
      name: b.name,
      category: b.category,
      description: b.description || '',
      address: b.address || '',
      zip: b.zip || '',
      phone: b.phone || '',
      website: b.website || '',
      image_url: b.image || '',
      rating: b.rating || 0,
      review_count: b.reviewCount || 0,
      is_open: b.isOpen,
      hours: b.hours || '',
      tags: b.tags || [],
      price_level: b.priceLevel || 2,
    };
  }

  if (type === 'event') {
    const e = data as Event;
    return {
      ...base,
      title: e.title,
      description: e.description || '',
      category: e.category || 'community',
      date: e.date || '',
      time: e.time || '',
      end_time: e.endTime || '',
      location: e.location || '',
      organizer: e.organizer || '',
      attendees: e.attendees || 0,
      price: e.price || 0,
      is_free: e.isFree,
      image_url: e.image || '',
      tags: e.tags || [],
      rsvp_link: e.rsvpLink || '',
    };
  }

  if (type === 'housing') {
    const h = data as Housing;
    return {
      ...base,
      title: h.title,
      description: h.description || '',
      address: h.address || '',
      zip: h.zip || '',
      price: h.price || 0,
      bedrooms: h.bedrooms || 1,
      bathrooms: h.bathrooms || 1,
      sqft: h.sqft || 0,
      property_type: h.propertyType || 'apartment',
      listing_type: h.listingType || 'rent',
      images: h.images || [],
      amenities: h.amenities || [],
      contact_name: h.contactName || '',
      contact_phone: h.contactPhone || '',
      contact_email: h.contactEmail || '',
      pet_friendly: h.petFriendly || false,
      parking: h.parking || false,
      available: h.available !== false,
    };
  }

  const j = data as Job;
  return {
    ...base,
    title: j.title,
    company: j.company || '',
    description: j.description || '',
    category: j.category || 'general',
    salary: j.salary || '',
    job_type: j.jobType || 'full-time',
    remote: j.remote || false,
    experience: j.experience || '',
    requirements: j.requirements || [],
    benefits: j.benefits || [],
    contact_email: j.contactEmail || '',
  };
}

// ── localStorage helpers (cache only — never source of truth) ─────────────────

function loadCache(): UserListing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCache(data: UserListing[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LISTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Supabase query ─────────────────────────────────────────────────────────────
// Fetches ALL active listings (visible to public) + owner's pending ones.
// Admins get everything via the service-key API route; anon client used for regular users.

async function querySupabase(
  userId: string | undefined,
  isAdmin: boolean,
): Promise<UserListing[]> {
  // Admin: use service-key API route so RLS doesn't block reads
  if (isAdmin) {
    console.log('[Listings] querySupabase | admin path → /api/admin-listing');
    try {
      const res = await fetch('/api/admin-listing');
      if (!res.ok) {
        console.error('[Listings] admin GET failed:', res.status, res.statusText);
        return [];
      }
      const { items } = await res.json() as { items: Array<{ type: ListingType; rows: Record<string, unknown>[] }> };
      const all = (items ?? []).flatMap(({ type, rows }) => rows.map((r) => rowToUserListing(r, type)));
      console.log('[Listings] admin fetched total:', all.length);
      return all;
    } catch (err) {
      console.error('[Listings] admin fetch error:', err);
      return [];
    }
  }

  if (!isSupabaseEnabled || !supabase) {
    console.log('[Listings] Supabase not configured — returning empty');
    return [];
  }

  console.log('[Listings] querySupabase | userId:', userId ?? 'anon');

  const tables: DbTable[] = ['businesses', 'events', 'housing', 'jobs'];
  const types: ListingType[] = ['business', 'event', 'housing', 'job'];

  const results = await Promise.all(
    tables.map(async (table, i) => {
      try {
        // Fetch all active rows (public read policy required in Supabase RLS)
        const { data: active, error: activeErr } = await supabase!
          .from(table)
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (activeErr) {
          console.error(`[Listings] fetch active ${table}:`, activeErr.code, activeErr.message);
          return [];
        }

        let rows = active || [];
        console.log(`[Listings] ${table} active rows: ${rows.length}`);

        // Append owner's pending rows so they see their own unapproved listings
        if (userId) {
          const { data: pending, error: pendingErr } = await supabase!
            .from(table)
            .select('*')
            .eq('owner_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (!pendingErr && pending?.length) {
            const seen = new Set(rows.map((r) => r.id as string));
            const extra = pending.filter((r) => !seen.has(r.id as string));
            rows = [...rows, ...extra];
            console.log(`[Listings] ${table} added ${extra.length} pending (owner)`);
          }
        }

        return rows.map((r) => rowToUserListing(r as Record<string, unknown>, types[i]));
      } catch (err) {
        console.error(`[Listings] unexpected error in ${table}:`, err);
        return [];
      }
    }),
  );

  const all = results.flat();
  console.log('[Listings] total fetched:', all.length);
  return all;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref to the current user so realtime callbacks are never stale.
  // The subscription is created once; the ref always gives it the live user.
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Stable fetch — reads from userRef, never recreated, no stale-closure risk.
  const doFetch = useCallback(async (): Promise<UserListing[]> => {
    const u = userRef.current;
    const isAdmin = u?.id === 'mock-admin-1';
    const isRealUser = u && !u.id.startsWith('mock-');
    const userId = isRealUser ? u.id : undefined;
    return querySupabase(userId, isAdmin);
  }, []); // intentionally empty deps — userRef is the stable bridge

  // Apply fetched rows to state + cache.
  // IMPORTANT: if the API/Supabase returns 0 rows (e.g. missing SELECT RLS policy),
  // we do NOT overwrite existing state so optimistic items are preserved.
  const applyFetch = useCallback(async () => {
    const all = await doFetch();
    if (all.length > 0) {
      setUserListings(all);
      saveCache(all);
    }
    return all;
  }, [doFetch]);

  // ── Initial load on user change ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    if (!isSupabaseEnabled || !supabase) {
      // Supabase not configured — fall back to localStorage cache
      setUserListings(loadCache());
      setIsLoading(false);
      return;
    }

    doFetch().then((all) => {
      if (cancelled) return;
      if (all.length > 0) {
        setUserListings(all);
        saveCache(all);
      } else {
        // Supabase returned empty; use cache to avoid blank screen
        const cached = loadCache();
        if (cached.length > 0) setUserListings(cached);
      }
    }).catch((err) => {
      console.error('[Listings] init fetch error:', err);
      setUserListings(loadCache()); // last-resort cache
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id, doFetch]);

  // ── Supabase Realtime — subscribed once, stable ────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;

    const onEvent = (table: string, eventType: string) => {
      console.log(`[Listings] Realtime ${eventType} on ${table} — refetching`);
      applyFetch();
    };

    const channel = supabase
      .channel('listings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' },
        (p) => onEvent('businesses', p.eventType))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' },
        (p) => onEvent('events', p.eventType))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housing' },
        (p) => onEvent('housing', p.eventType))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' },
        (p) => onEvent('jobs', p.eventType))
      .subscribe((status, err) => {
        console.log('[Listings] Realtime status:', status, err ?? '');
      });

    return () => { supabase!.removeChannel(channel); };
  }, [applyFetch]); // applyFetch is stable (only recreated if doFetch changes, which never happens)

  // ── addListing ─────────────────────────────────────────────────────────────
  const addListing = useCallback(async (listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => {
    const id = genId();
    const optimistic: UserListing = {
      ...listing, id, createdAt: new Date().toISOString(), status: 'active',
    };

    const u = userRef.current;
    const isAdminUser = listing.publishedBy === 'mock-admin-1';
    const isRealUser = listing.publishedBy && !listing.publishedBy.startsWith('mock-');

    console.log('CURRENT USER', u);
    console.log('USER ID', u?.id);
    console.log('[addListing] isSupabaseEnabled:', isSupabaseEnabled, '| isAdminUser:', isAdminUser, '| isRealUser:', isRealUser);

    if (isAdminUser) {
      // Admin has no Supabase JWT — use service-key API route for INSERT
      const row = listingToDbRow(id, listing);
      console.log('ADMIN API PAYLOAD', { type: listing.type, row });

      // Optimistic update first so the UI reflects immediately
      setUserListings((prev) => { const u2 = [optimistic, ...prev]; saveCache(u2); return u2; });

      const res = await fetch('/api/admin-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: listing.type, row }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: string };
        console.error('ADMIN API INSERT ERROR', errBody.error ?? res.statusText);
        throw new Error(errBody.error ?? 'Admin listing insert failed');
      }

      console.log('ADMIN API INSERT DATA success — table:', getTable(listing.type));

    } else if (isSupabaseEnabled && supabase && isRealUser) {
      const table = getTable(listing.type);
      const payload = listingToDbRow(id, listing);

      console.log('TABLE', table);
      console.log('PAYLOAD', payload);

      // Plain .insert() — do NOT chain .select().single() which requires a SELECT RLS policy.
      const { error } = await supabase.from(table).insert(payload);

      console.log('INSERT ERROR', error);

      if (error) {
        console.error('[addListing] INSERT failed:', error.code, error.message, error.details, error.hint);
        throw new Error(`Insert failed (${error.code}): ${error.message}${error.hint ? ' — ' + error.hint : ''}`);
      }

      console.log('INSERT RESULT', 'success — row written to Supabase table:', table);

      // Optimistic update; Realtime propagates the INSERT to other clients automatically.
      // We do NOT call applyFetch() here because if there is no SELECT RLS policy,
      // applyFetch would return [] and wipe the optimistic item from state + cache.
      setUserListings((prev) => { const u2 = [optimistic, ...prev]; saveCache(u2); return u2; });

    } else {
      console.warn('[addListing] Supabase not configured — saving to localStorage only');
      setUserListings((prev) => { const u2 = [optimistic, ...prev]; saveCache(u2); return u2; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── deleteListing ──────────────────────────────────────────────────────────
  const deleteListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const listing = prev.find((l) => l.id === id);
      const updated = prev.filter((l) => l.id !== id);
      saveCache(updated);

      if (listing?.publishedBy === 'mock-admin-1') {
        fetch('/api/admin-listing', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: listing.type, id }),
        }).then((r) => { if (!r.ok) console.error('[Listings] Admin delete failed'); });
      } else if (isSupabaseEnabled && supabase && listing && !listing.publishedBy.startsWith('mock-')) {
        supabase.from(getTable(listing.type)).delete().eq('id', id)
          .then(({ error }) => {
            if (error) console.error('[deleteListing] error:', error.message);
          });
      }

      return updated;
    });
  }, []);

  // ── approveListing / rejectListing ─────────────────────────────────────────
  const approveListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, status: 'active' as const } : l);
      saveCache(updated);
      return updated;
    });
    const listing = userListings.find((l) => l.id === id);
    if (isSupabaseEnabled && supabase && listing && !listing.publishedBy.startsWith('mock-')) {
      supabase.from(getTable(listing.type)).update({ status: 'active' }).eq('id', id)
        .then(({ error }) => { if (error) console.error('[approve] error:', error.message); });
    }
  }, [userListings]);

  const rejectListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, status: 'pending' as const } : l);
      saveCache(updated);
      return updated;
    });
    const listing = userListings.find((l) => l.id === id);
    if (isSupabaseEnabled && supabase && listing && !listing.publishedBy.startsWith('mock-')) {
      supabase.from(getTable(listing.type)).update({ status: 'pending' }).eq('id', id)
        .then(({ error }) => { if (error) console.error('[reject] error:', error.message); });
    }
  }, [userListings]);

  const getListingsByUser = useCallback(
    (userId: string) => userListings.filter((l) => l.publishedBy === userId),
    [userListings],
  );

  const activeListings = userListings.filter((l) => l.status === 'active');

  return (
    <ListingsContext.Provider value={{
      userListings, addListing, deleteListing,
      approveListing, rejectListing, getListingsByUser,
      activeListings, isLoading,
    }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
}

// ── Helper for add-listing page ───────────────────────────────────────────────

export function buildListingData(type: ListingType, form: Record<string, string>, userId: string, userName: string): Business | Event | Housing | Job {
  const id = genId();
  const city = form.city || 'New York';
  const state = form.state || 'NY';

  if (type === 'business') {
    return {
      id, type: 'business',
      name: form.title || 'Untitled Business',
      category: (form.category as Business['category']) || 'other',
      description: form.description || '',
      address: form.address || '',
      city, state,
      zip: form.zip || '',
      phone: form.phone || '',
      website: form.website || undefined,
      rating: 0, reviewCount: 0,
      isOpen: true,
      hours: form.hours || 'Mon-Sat 9am-6pm',
      image: `https://source.unsplash.com/400x300/?${encodeURIComponent(form.category || 'business')}`,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      priceLevel: 2,
    } as Business;
  }

  if (type === 'event') {
    return {
      id, type: 'event',
      title: form.title || 'Untitled Event',
      description: form.description || '',
      category: form.category || 'community',
      date: form.eventDate || new Date().toISOString().split('T')[0],
      time: form.eventTime || '6:00 PM',
      location: form.location || '',
      city, state,
      organizer: userName,
      attendees: 0,
      price: parseFloat(form.price || '0'),
      isFree: !form.price || form.price === '0',
      image: 'https://source.unsplash.com/400x300/?event,community',
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    } as Event;
  }

  if (type === 'housing') {
    return {
      id, type: 'housing',
      title: form.title || 'Untitled Property',
      description: form.description || '',
      address: form.address || '',
      city, state,
      zip: form.zip || '',
      price: parseFloat(form.price || '0'),
      bedrooms: parseInt(form.bedrooms || '1'),
      bathrooms: parseFloat(form.bathrooms || '1'),
      sqft: parseInt(form.sqft || '500'),
      propertyType: (form.propertyType as Housing['propertyType']) || 'apartment',
      listingType: (form.listingType as Housing['listingType']) || 'rent',
      images: ['https://source.unsplash.com/400x300/?apartment,home'],
      amenities: [],
      contactName: userName,
      contactPhone: form.phone || '',
      contactEmail: form.email || '',
      postedDate: new Date().toISOString().split('T')[0],
      available: true,
      petFriendly: false,
      parking: false,
    } as Housing;
  }

  return {
    id, type: 'job',
    title: form.title || 'Untitled Position',
    company: form.company || userName,
    description: form.description || '',
    category: form.category || 'other',
    city, state,
    salary: form.salary || 'Competitive',
    jobType: (form.jobType as Job['jobType']) || 'full-time',
    remote: form.remote === 'true',
    experience: form.experience || 'Any',
    requirements: form.requirements ? form.requirements.split(',').map((r) => r.trim()).filter(Boolean) : [],
    benefits: [],
    contactEmail: form.email || '',
    postedDate: new Date().toISOString().split('T')[0],
  } as Job;
}
