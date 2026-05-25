'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppContextType, User, ToastNotification, ChatMessage } from './types';
import { supabase, isSupabaseEnabled, DbProfile } from './supabase';

const STORAGE_KEY = 'community-connect-user';


const SAVED_KEY_MAP = {
  businesses: 'savedBusinesses',
  events: 'savedEvents',
  housing: 'savedHousing',
  jobs: 'savedJobs',
} as const;

function profileToUser(profile: DbProfile): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name || profile.email.split('@')[0],
    role: 'user',
    avatar: profile.avatar_url ?? undefined,
    savedBusinesses: [],
    savedEvents: [],
    savedHousing: [],
    savedJobs: [],
    createdAt: profile.created_at,
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('New York');
  const [selectedState, setSelectedState] = useState('NY');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // ── Session restore on mount ───────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Try Supabase session first
        if (isSupabaseEnabled && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single<DbProfile>();
            if (profile) {
              setUser(profileToUser(profile));
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. Fall back to localStorage (mock session)
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as User;
          if (saved?.id && saved?.role) {
            // Never trust localStorage for admin role — only mock-admin-1 can be admin
            const safeUser = saved.id === 'mock-admin-1' ? saved : { ...saved, role: 'user' as const };
            setUser(safeUser);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ── Supabase auth state listener ───────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Keep user data up-to-date after token refresh — re-fetch profile
          const { data: profile } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single<DbProfile>();
          if (profile) setUser(profileToUser(profile));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<void> => {
    const key = username.toLowerCase().trim();

    // 1. Server-side admin credentials (ADMIN_USERNAME / ADMIN_PASSWORD in .env.local)
    //    Credentials never reach the client — the API route does the comparison.
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: key, password }),
      });

      if (res.ok) {
        const { user: adminUser, supabaseEmail } = await res.json() as { user: User; supabaseEmail: string | null };

        // If ADMIN_SUPABASE_EMAIL is configured, sign into Supabase to get a real JWT
        // so that RLS policies (auth.uid() = owner_id) work for admin-created listings.
        if (supabaseEmail && isSupabaseEnabled && supabase) {
          try {
            const { data: sbData } = await supabase.auth.signInWithPassword({
              email: supabaseEmail,
              password,
            });
            if (sbData?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sbData.user.id)
                .single<DbProfile>();
              if (profile) {
                setUser(profileToUser(profile));
                return;
              }
              // Profile row not found — build user from auth data with admin role
              setUser({
                id: sbData.user.id,
                email: sbData.user.email ?? adminUser.email,
                name: adminUser.name,
                role: 'admin' as const,
                savedBusinesses: [],
                savedEvents: [],
                savedHousing: [],
                savedJobs: [],
                createdAt: sbData.user.created_at,
              });
              return;
            }
          } catch { /* Supabase sign-in failed — fall through to mock admin */ }
        }

        // Fallback: ADMIN_SUPABASE_EMAIL not set or Supabase sign-in failed — use mock admin
        let userData = { ...adminUser };
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const prev = JSON.parse(raw) as User;
            if (prev.id === userData.id) userData = { ...userData, ...prev };
          }
        } catch { /* ignore */ }
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return;
      }
      // 401 = wrong credentials; 500 = not configured — fall through
    } catch { /* network error — fall through */ }

    // 2. Supabase email auth for real users (username must be an email address)
    if (key.includes('@') && isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: key,
        password,
      });
      if (error) throw new Error(error.message);

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single<DbProfile>();

        const userData = profile
          ? profileToUser(profile)
          : {
              id: data.user.id,
              email: data.user.email ?? '',
              name: data.user.email?.split('@')[0] ?? 'User',
              role: 'user' as const,
              savedBusinesses: [],
              savedEvents: [],
              savedHousing: [],
              savedJobs: [],
              createdAt: data.user.created_at,
            };

        setUser(userData);
        return;
      }
    }

    throw new Error('Invalid email or password.');
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), toast.duration || 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearChat = useCallback(() => setChatMessages([]), []);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const toggleSaved = useCallback(
    async (type: 'businesses' | 'events' | 'housing' | 'jobs', id: string) => {
      if (!user) {
        addToast({ type: 'info', message: 'Connectez-vous pour sauvegarder des éléments.' });
        return;
      }

      const key = SAVED_KEY_MAP[type] as keyof User;
      const savedList = (user[key] as string[]) ?? [];
      const isAlreadySaved = savedList.includes(id);

      // Supabase favorites sync
      if (isSupabaseEnabled && supabase && !user.id.startsWith('mock-')) {
        const itemType = type.replace('s', '') as 'business' | 'event' | 'housing' | 'job';
        if (isAlreadySaved) {
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', id)
            .eq('item_type', itemType);
        } else {
          await supabase
            .from('favorites')
            .insert({ user_id: user.id, item_id: id, item_type: itemType });
        }
      }

      const updatedUser: User = {
        ...user,
        [key]: isAlreadySaved ? savedList.filter((sid) => sid !== id) : [...savedList, id],
      };

      setUser(updatedUser);
      if (user.id.startsWith('mock-')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      }

      addToast({
        type: 'success',
        message: isAlreadySaved ? 'Retiré des favoris' : 'Ajouté aux favoris !',
      });
    },
    [user, addToast]
  );

  const isSaved = useCallback(
    (type: 'businesses' | 'events' | 'housing' | 'jobs', id: string): boolean => {
      if (!user) return false;
      const key = SAVED_KEY_MAP[type] as keyof User;
      return ((user[key] as string[]) ?? []).includes(id);
    },
    [user]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        selectedCity,
        selectedState,
        toasts,
        chatMessages,
        setSelectedCity,
        setSelectedState,
        addToast,
        removeToast,
        addChatMessage,
        clearChat,
        toggleSaved,
        isSaved,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// Export for register page
export { isSupabaseEnabled };
