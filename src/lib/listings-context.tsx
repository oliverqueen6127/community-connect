'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  const base = { id, owner_id: publishedBy, city: data.city, state: data.state, status: 'active' };

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

// ── Storage helpers ───────────────────────────────────────────────────────────

function load(): UserListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(data: UserListing[]) {
  try { localStorage.setItem(LISTINGS_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Supabase fetch helper ─────────────────────────────────────────────────────

async function fetchAllFromSupabase(userId?: string, isAdmin?: boolean): Promise<UserListing[]> {
  if (!isSupabaseEnabled || !supabase) return [];

  console.log('[Listings] Supabase configured:', isSupabaseEnabled, '| fetching for user:', userId ?? 'anonymous', '| isAdmin:', isAdmin);

  const tables: DbTable[] = ['businesses', 'events', 'housing', 'jobs'];
  const types: ListingType[] = ['business', 'event', 'housing', 'job'];

  const results = await Promise.all(
    tables.map(async (table, i) => {
      try {
        if (isAdmin) {
          // Admin sees all listings regardless of status
          const { data, error } = await supabase!
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });
          if (error) { console.error(`[Listings] fetch ${table} error:`, error.message); return []; }
          console.log(`[Listings] ${table}: fetched ${data?.length ?? 0} rows (admin)`);
          return (data || []).map((row) => rowToUserListing(row as Record<string, unknown>, types[i]));
        }

        // Regular or anonymous: fetch all active listings
        const { data: activeData, error: activeError } = await supabase!
          .from(table)
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        if (activeError) { console.error(`[Listings] fetch active ${table} error:`, activeError.message); return []; }

        let rows = activeData || [];

        // Also fetch owner's pending listings so they see their own pending items
        if (userId) {
          const { data: pendingData } = await supabase!
            .from(table)
            .select('*')
            .eq('owner_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
          if (pendingData && pendingData.length > 0) {
            // Merge, deduplicating by id
            const ids = new Set(rows.map((r) => r.id));
            rows = [...rows, ...pendingData.filter((r) => !ids.has(r.id))];
          }
        }

        console.log(`[Listings] ${table}: fetched ${rows.length} rows`);
        return rows.map((row) => rowToUserListing(row as Record<string, unknown>, types[i]));
      } catch (err) {
        console.error(`[Listings] unexpected error fetching ${table}:`, err);
        return [];
      }
    })
  );

  const all = results.flat();
  console.log('[Listings] total fetched from Supabase:', all.length);
  return all;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [userListings, setUserListings] = useState<UserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const isRealUser = user && !user.id.startsWith('mock-');
    const isAdmin = user?.role === 'admin';
    const all = await fetchAllFromSupabase(isRealUser ? user.id : undefined, isAdmin);
    setUserListings(all);
    save(all);
    return all;
  }, [user]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // Show cached data immediately while fetching
      const cached = load();
      if (cached.length > 0) setUserListings(cached);

      if (!isSupabaseEnabled || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        await refresh();
      } catch (err) {
        console.error('[Listings] init fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Realtime subscription — refetch on any change to listings tables
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;

    const channel = supabase
      .channel('listings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => { refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housing' }, () => { refresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => { refresh(); })
      .subscribe((status) => {
        console.log('[Listings] Realtime subscription status:', status);
      });

    return () => { supabase!.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const addListing = useCallback(async (listing: Omit<UserListing, 'id' | 'createdAt' | 'status'>) => {
    const id = genId();
    const newListing: UserListing = {
      ...listing,
      id,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    const isRealUser = listing.publishedBy && !listing.publishedBy.startsWith('mock-');

    console.log('[addListing] Supabase enabled:', isSupabaseEnabled, '| user id:', listing.publishedBy, '| isRealUser:', isRealUser);

    if (isSupabaseEnabled && supabase && isRealUser) {
      const table = getTable(listing.type);
      const row = listingToDbRow(id, listing);
      console.log('[addListing] inserting into table:', table, '| row id:', id);

      const { data, error } = await supabase.from(table).insert(row).select().single();

      if (error) {
        console.error('[addListing] Supabase insert failed:', error.message, error);
        // Fall back: add to local state only so user at least sees it on their device
        setUserListings((prev) => {
          const updated = [newListing, ...prev];
          save(updated);
          return updated;
        });
      } else {
        console.log('[addListing] insert success:', data);
        // Optimistic update so the new listing is visible immediately
        setUserListings((prev) => {
          const updated = [newListing, ...prev];
          save(updated);
          return updated;
        });
        // Realtime will trigger a full refresh on all other clients automatically.
        // On this client, also refresh to get the server-assigned created_at etc.
        try { await refresh(); } catch { /* keep optimistic state */ }
      }
    } else {
      // Mock user or no Supabase: localStorage only
      setUserListings((prev) => {
        const updated = [newListing, ...prev];
        save(updated);
        return updated;
      });
    }
  }, [refresh]);

  const deleteListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const listing = prev.find((l) => l.id === id);
      const updated = prev.filter((l) => l.id !== id);
      save(updated);

      if (isSupabaseEnabled && supabase && listing && !listing.publishedBy.startsWith('mock-')) {
        supabase.from(getTable(listing.type)).delete().eq('id', id).then(() => {});
      }

      return updated;
    });
  }, []);

  const approveListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, status: 'active' as const } : l);
      save(updated);
      return updated;
    });

    if (isSupabaseEnabled && supabase) {
      const listing = userListings.find((l) => l.id === id);
      if (listing && !listing.publishedBy.startsWith('mock-')) {
        supabase.from(getTable(listing.type)).update({ status: 'active' }).eq('id', id).then(() => {});
      }
    }
  }, [userListings]);

  const rejectListing = useCallback((id: string) => {
    setUserListings((prev) => {
      const updated = prev.map((l) => l.id === id ? { ...l, status: 'pending' as const } : l);
      save(updated);
      return updated;
    });

    if (isSupabaseEnabled && supabase) {
      const listing = userListings.find((l) => l.id === id);
      if (listing && !listing.publishedBy.startsWith('mock-')) {
        supabase.from(getTable(listing.type)).update({ status: 'pending' }).eq('id', id).then(() => {});
      }
    }
  }, [userListings]);

  const getListingsByUser = useCallback((userId: string) =>
    userListings.filter((l) => l.publishedBy === userId), [userListings]);

  const activeListings = userListings.filter((l) => l.status === 'active');

  return (
    <ListingsContext.Provider value={{
      userListings, addListing, deleteListing,
      approveListing, rejectListing, getListingsByUser, activeListings, isLoading,
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
      image: `https://source.unsplash.com/400x300/?event,community`,
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
      images: [`https://source.unsplash.com/400x300/?apartment,home`],
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
