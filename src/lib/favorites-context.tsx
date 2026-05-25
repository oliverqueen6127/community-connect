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
  events: 'event',
  housing: 'housing',
  jobs: 'job',
};
const DB_TO_TYPE: Record<string, FavType> = {
  business: 'businesses',
  event: 'events',
  housing: 'housing',
  job: 'jobs',
};

// Composite key for O(1) lookup: "business:listing-id"
function makeKey(dbType: string, listingId: string) {
  return `${dbType}:${listingId}`;
}

const MOCK_FAV_KEY = 'cc-favorites-mock';

interface FavoritesContextType {
  isSaved: (type: FavType, id: string) => boolean;
  toggleSaved: (type: FavType, id: string) => Promise<void>;
  favoritesCount: number;
  savedIds: Record<FavType, string[]>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, addToast } = useApp();

  // saved: composite-key → true  (e.g. "business:b-123": true)
  const [saved, setSaved] = useState<Record<string, true>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Track keys we just wrote ourselves so Realtime events don't double-apply
  const pendingRef = useRef<Set<string>>(new Set());

  // ── Load favorites when user changes ────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSaved({});
      return;
    }

    if (user.id.startsWith('mock-')) {
      // Mock user: load from localStorage
      try {
        const raw = localStorage.getItem(MOCK_FAV_KEY);
        if (raw) setSaved(JSON.parse(raw) as Record<string, true>);
        else setSaved({});
      } catch {
        setSaved({});
      }
      return;
    }

    if (!isSupabaseEnabled || !supabase) {
      setSaved({});
      return;
    }

    // Real Supabase user: fetch from DB
    setIsLoading(true);
    supabase
      .from('favorites')
      .select('listing_id, listing_type')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error || !data) { setIsLoading(false); return; }
        const next: Record<string, true> = {};
        for (const row of data) {
          next[makeKey(row.listing_type as string, row.listing_id as string)] = true;
        }
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

      const dbType = TYPE_TO_DB[type];
      const key = makeKey(dbType, id);
      const alreadySaved = !!saved[key];

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
        type: 'success',
        message: alreadySaved ? 'Removed from favorites' : 'Added to favorites',
      });

      // Persist
      if (user.id.startsWith('mock-')) {
        // Mock user: persist to localStorage
        setSaved((prev) => {
          const next = { ...prev };
          if (alreadySaved) delete next[key]; else next[key] = true;
          try { localStorage.setItem(MOCK_FAV_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
        return;
      }

      if (!isSupabaseEnabled || !supabase) return;

      // Mark as pending so Realtime echo is ignored
      pendingRef.current.add(key);

      try {
        if (alreadySaved) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('listing_id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert({ user_id: user.id, listing_id: id, listing_type: dbType });
          if (error) throw error;
        }
      } catch (err) {
        // Rollback optimistic update
        setSaved((prev) => {
          if (alreadySaved) return { ...prev, [key]: true };
          const next = { ...prev };
          delete next[key];
          return next;
        });
        pendingRef.current.delete(key);
        const msg = err instanceof Error ? err.message : String(err);
        addToast({ type: 'error', message: `Failed to update favorites: ${msg}` });
      }
    },
    [user, saved, addToast]
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const favoritesCount = Object.keys(saved).length;

  const savedIds: Record<FavType, string[]> = {
    businesses: [], events: [], housing: [], jobs: [],
  };
  for (const key of Object.keys(saved)) {
    const sep = key.indexOf(':');
    if (sep === -1) continue;
    const dbType = key.slice(0, sep);
    const listingId = key.slice(sep + 1);
    const type = DB_TO_TYPE[dbType];
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
