'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppContextType, User, ToastNotification, ChatMessage } from './types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('New York');
  const [selectedState, setSelectedState] = useState('NY');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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
        addToast({ type: 'info', message: 'Please sign in to save items' });
        return;
      }
      const key = `saved_${type}` as keyof User;
      const savedList = user[key] as string[];
      const isAlreadySaved = savedList.includes(id);
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [key]: isAlreadySaved
            ? savedList.filter((sid) => sid !== id)
            : [...savedList, id],
        };
      });
      addToast({
        type: 'success',
        message: isAlreadySaved ? 'Removed from saved' : 'Saved successfully!',
      });
    },
    [user, addToast]
  );

  const isSaved = useCallback(
    (type: 'businesses' | 'events' | 'housing' | 'jobs', id: string): boolean => {
      if (!user) return false;
      const key = `saved${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof User;
      const savedList = user[key] as string[];
      return savedList?.includes(id) ?? false;
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
