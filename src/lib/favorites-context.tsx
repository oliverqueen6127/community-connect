'use client';

import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from 'react';
import { useApp } from './context';
import { supabase, isSupabaseEnabled } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FavType = 'businesses' | 'events' | 'housing' | 'jobs';

// DB stores singular listing_type; context uses plural FavType
const TYPE_TO_DB: Record<FavType, string> = {
  businesses: 'business',
  events:     'event',
  housing:    'housing',
  jobs:       'job',
};
const DB_TO_TYPE: Record<string, FavType> = {
  business: 'businesses',
  event:    'events',
  housing:  'housing',
  job:      'jobs',
};

// Composite key for O(1) lookup: "business:listing-id"
function makeKey(dbType: string, listingId: string) {
  return `${dbType}:${listingId}`;
}

const MOCK_FAV_KEY = 'cc-favorites-mock';

interface FavoritesContextType {
  isSaved:        (type: FavType, id: string) => boolean;
  toggleSaved:    (type: FavType, id: string) => Promise<void>;
  favoritesCount: number;
  savedIds:       Record<FavType, string[]>;
  isLoading:      boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, addToast } = useApp();

  // saved: composite-key → true  (e.g. "business:b1": true)
  const [saved, setSaved] = useState<Record<string, true>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Track keys we just wrote ourselves so Realtime echo is ignored
  const pendingRef = useRef<Set<string>>(new Set());

  // ── Load favorites when user changes ────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSaved({});
      return;
    }

    if (user.id.startsWith('mock-')) {
      try {
        const raw = localStorage.getItem(MOCK_FAV_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, true>) : {};
        console.log('[Favorites] mock-user load from localStorage:', parsed);
        setSaved(parsed);
      } catch {
        setSaved({});
      }
      return;
    }

    if (!isSupabaseEnabled || !supabase) {
      setSaved({});
      return;
    }

    setIsLoading(true);
    console.log('[Favorites] fetching from Supabase for user:', user.id);

    supabase
      .from('favorites')
      .select('listing_id, listing_type')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        console.log('[Favorites] SELECT result → data:', data, '| error:', error);
        if (error) {
          console.error('[Favorites] SELECT error:', error.message, error.details, error.hint);
          setIsLoading(false);
          return;
        }
        const next: Record<string, true> = {};
        for (const row of data ?? []) {
          const key = makeKey(row.listing_type as string, row.listing_id as string);
          next[key] = true;
        }
        console.log('[Favorites] built saved map:', next);
        setSaved(next);
        setIsLoading(false);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.id.startsWith('mock-') || !isSupabaseEnabled || !supabase) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = (supabase.channel(`favorites-rt-${user.id}`) as any)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'favorites', filter: `user_id=eq.${user.id}` },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new;
          const key = makeKey(row.listing_type as string, row.listing_id as string);
          if (pendingRef.current.has(key)) { pendingRef.current.delete(key); return; }
          setSaved((prev) => (key in prev ? prev : { ...prev, [key]: true }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'favorites', filter: `user_id=eq.${user.id}` },
        (payload: { old: Record<string, unknown> }) => {
          const row = payload.old;
          const key = makeKey(row.listing_type as string, row.listing_id as string);
          if (pendingRef.current.has(key)) { pendingRef.current.delete(key); return; }
          setSaved((prev) => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      )
      .subscribe();

    return () => { supabase!.removeChannel(ch); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── isSaved ────────────────────────────────────────────────────────────────
  const isSaved = useCallback(
    (type: FavType, id: string): boolean => {
      return !!saved[makeKey(TYPE_TO_DB[type], id)];
    },
    [saved]
  );

  // ── toggleSaved ────────────────────────────────────────────────────────────
  const toggleSaved = useCallback(
    async (type: FavType, id: string) => {
      if (!user) {
        addToast({ type: 'info', message: 'Sign in to save listings.' });
        return;
      }

      const dbType  = TYPE_TO_DB[type];
      const key     = makeKey(dbType, id);
      const alreadySaved = !!saved[key];

      console.log('FAVORITE USER', user);
      console.log('FAVORITE PAYLOAD', { listing_id: id, listing_type: dbType, user_id: user.id, alreadySaved });

      // Optimistic update
      setSaved((prev) => {
        if (alreadySaved) {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: true };
      });

      addToast({
        type:    'success',
        message: alreadySaved ? 'Removed from favorites' : 'Added to favorites',
      });

      // ── Mock user: localStorage only ────────────────────────────────────────
      if (user.id.startsWith('mock-')) {
        const raw    = localStorage.getItem(MOCK_FAV_KEY);
        const stored = raw ? (JSON.parse(raw) as Record<string, true>) : {};
        if (alreadySaved) delete stored[key]; else stored[key] = true;
        localStorage.setItem(MOCK_FAV_KEY, JSON.stringify(stored));
        console.log('[Favorites] mock localStorage updated:', stored);
        return;
      }

      if (!isSupabaseEnabled || !supabase) return;

      // Mark as pending so Realtime echo is ignored
      pendingRef.current.add(key);

      if (alreadySaved) {
        // ── DELETE ────────────────────────────────────────────────────────────
        const { data, error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id)
          .select();

        console.log('FAVORITE DELETE DATA',  data);
        console.log('FAVORITE DELETE ERROR', error);

        if (error) {
          // Rollback
          setSaved((prev) => ({ ...prev, [key]: true }));
          pendingRef.current.delete(key);
          addToast({ type: 'error', message: `Failed to remove favorite: ${error.message}` });
        }
      } else {
        // ── INSERT ────────────────────────────────────────────────────────────
        const { data, error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: id, listing_type: dbType })
          .select()
          .single();

        console.log('FAVORITE INSERT DATA',  data);
        console.log('FAVORITE INSERT ERROR', error);

        if (error) {
          // Rollback
          setSaved((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          pendingRef.current.delete(key);
          addToast({ type: 'error', message: `Failed to save favorite: ${error.message}` });
        }
      }
    },
    [user, saved, addToast]
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const favoritesCount = Object.keys(saved).length;

  const savedIds: Record<FavType, string[]> = { businesses: [], events: [], housing: [], jobs: [] };
  for (const key of Object.keys(saved)) {
    const sep     = key.indexOf(':');
    if (sep === -1) continue;
    const dbType  = key.slice(0, sep);
    const listingId = key.slice(sep + 1);
    const type    = DB_TO_TYPE[dbType];
    if (type) savedIds[type].push(listingId);
  }

  return (
    <FavoritesContext.Provider value={{ isSaved, toggleSaved, favoritesCount, savedIds, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
