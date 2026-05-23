'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppContextType, User, ToastNotification, ChatMessage } from './types';

const STORAGE_KEY = 'community-connect-user';

const MOCK_ACCOUNTS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin',
    user: {
      id: '1',
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
      id: '2',
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('New York');
  const [selectedState, setSelectedState] = useState('NY');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Auto-reconnect from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as User;
        if (saved?.id && saved?.role) {
          setUser(saved);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 700));

    const key = username.toLowerCase().trim();
    const account = MOCK_ACCOUNTS[key];

    if (!account || account.password !== password) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    // Restore saved items if a previous session existed
    let userData = { ...account.user };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const prev = JSON.parse(raw) as User;
        if (prev.id === userData.id) {
          userData = { ...userData, ...prev };
        }
      }
    } catch { /* ignore */ }

    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  }, []);

  const clearChat = useCallback(() => {
    setChatMessages([]);
  }, []);

  const toggleSaved = useCallback(
    (type: 'businesses' | 'events' | 'housing' | 'jobs', id: string) => {
      if (!user) {
        addToast({ type: 'info', message: 'Connectez-vous pour sauvegarder des éléments.' });
        return;
      }
      const key = SAVED_KEY_MAP[type] as keyof User;
      const savedList = (user[key] as string[]) ?? [];
      const isAlreadySaved = savedList.includes(id);

      const updatedUser: User = {
        ...user,
        [key]: isAlreadySaved
          ? savedList.filter((sid) => sid !== id)
          : [...savedList, id],
      };

      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));

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
      const savedList = (user[key] as string[]) ?? [];
      return savedList.includes(id);
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
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
