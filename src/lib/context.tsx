'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppContextType, User, ToastNotification, ChatMessage } from './types';
import { supabase, isSupabaseEnabled, DbProfile } from './supabase';

const STORAGE_KEY = 'community-connect-user';

// ── Mock accounts always available (dev / demo) ───────────────────────────────
const MOCK_ACCOUNTS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin',
    user: {
      id: 'mock-admin-1',
      name: 'Administrator',
      email: 'admin@communityconnect.local',
      role: 'admin',
      savedBusinesses: [],
      savedEvents: [],
      savedHousing: [],
      savedJobs: [],
      createdAt: new Date().toISOString(),
    },
  },
  user: {
    password: 'user',
    user: {
      id: 'mock-user-2',
      name: 'Demo User',
      email: 'user@communityconnect.local',
      role: 'user',
      savedBusinesses: [],
      savedEvents: [],
      savedHousing: [],
      savedJobs: [],
      createdAt: new Date().toISOString(),
    },
  },
};

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
    role: profile.role,
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
          if (saved?.id && saved?.role) setUser(saved);
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

    // Always allow demo accounts (works even with Supabase enabled)
    const mock = MOCK_ACCOUNTS[key];
    if (mock && mock.password === password) {
      let userData = { ...mock.user };
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

    // Supabase email auth
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
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

    throw new Error('Identifiant ou mot de passe incorrect.');
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
