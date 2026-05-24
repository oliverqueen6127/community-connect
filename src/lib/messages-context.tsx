'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserMessage, SupportMessage } from './types';
import { supabase, isSupabaseEnabled, DbSupportMessage } from './supabase';
import { useApp } from './context';

const MESSAGES_KEY = 'cc-user-messages';
const SUPPORT_KEY = 'cc-support-messages';

interface MessagesContextType {
  userMessages: UserMessage[];
  supportMessages: SupportMessage[];
  sendUserMessage: (msg: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => void;
  sendSupportMessage: (msg: Omit<SupportMessage, 'id' | 'timestamp' | 'read'>) => void;
  markUserMessageRead: (id: string) => void;
  markSupportMessageRead: (id: string) => void;
  deleteSupportMessage: (id: string) => void;
  deleteUserMessage: (id: string) => void;
  unreadUserCount: (userId: string) => number;
  unreadSupportCount: number;
  replyToUserMessage: (msg: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

function saveToStorage<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

function dbToSupportMessage(row: DbSupportMessage): SupportMessage {
  return {
    id: row.id,
    fromUserId: row.user_id ?? undefined,
    fromUserName: row.from_name,
    fromUserEmail: row.from_email,
    subject: row.subject || undefined,
    content: row.message,
    timestamp: row.created_at,
    page: row.page || undefined,
    read: row.status !== 'unread',
  };
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);

  // Reload when user changes (login / logout)
  useEffect(() => {
    const init = async () => {
      setUserMessages(loadFromStorage<UserMessage>(MESSAGES_KEY));

      const isRealUser = user && !user.id.startsWith('mock-');
      if (isSupabaseEnabled && supabase && isRealUser) {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSupportMessages((data as DbSupportMessage[]).map(dbToSupportMessage));
          return;
        }
      }

      setSupportMessages(loadFromStorage<SupportMessage>(SUPPORT_KEY));
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sendUserMessage = useCallback((msg: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => {
    const newMsg: UserMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setUserMessages((prev) => {
      const updated = [...prev, newMsg];
      saveToStorage(MESSAGES_KEY, updated);
      return updated;
    });
  }, []);

  const replyToUserMessage = useCallback((msg: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => {
    const newMsg: UserMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setUserMessages((prev) => {
      const updated = [...prev, newMsg];
      saveToStorage(MESSAGES_KEY, updated);
      return updated;
    });
  }, []);

  const sendSupportMessage = useCallback((msg: Omit<SupportMessage, 'id' | 'timestamp' | 'read'>) => {
    const newMsg: SupportMessage = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setSupportMessages((prev) => {
      const updated = [...prev, newMsg];
      saveToStorage(SUPPORT_KEY, updated);
      return updated;
    });

    // Async Supabase persist
    if (isSupabaseEnabled && supabase) {
      supabase.from('support_messages').insert({
        user_id: msg.fromUserId || null,
        from_name: msg.fromUserName,
        from_email: msg.fromUserEmail,
        subject: msg.subject || '',
        message: msg.content,
        page: msg.page || '',
        status: 'unread',
      }).then(({ error }) => {
        if (error) console.error('[Support] Supabase insert failed:', error.message);
      });
    }
  }, []);

  const markUserMessageRead = useCallback((id: string) => {
    setUserMessages((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, read: true } : m);
      saveToStorage(MESSAGES_KEY, updated);
      return updated;
    });
  }, []);

  const markSupportMessageRead = useCallback((id: string) => {
    setSupportMessages((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, read: true } : m);
      saveToStorage(SUPPORT_KEY, updated);
      return updated;
    });

    if (isSupabaseEnabled && supabase) {
      supabase.from('support_messages').update({ status: 'read' }).eq('id', id).then(() => {});
    }
  }, []);

  const deleteSupportMessage = useCallback((id: string) => {
    setSupportMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveToStorage(SUPPORT_KEY, updated);
      return updated;
    });

    if (isSupabaseEnabled && supabase) {
      supabase.from('support_messages').delete().eq('id', id).then(() => {});
    }
  }, []);

  const deleteUserMessage = useCallback((id: string) => {
    setUserMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveToStorage(MESSAGES_KEY, updated);
      return updated;
    });
  }, []);

  const unreadUserCount = useCallback((userId: string) =>
    userMessages.filter((m) => m.toUserId === userId && !m.read).length,
  [userMessages]);

  const unreadSupportCount = supportMessages.filter((m) => !m.read).length;

  return (
    <MessagesContext.Provider value={{
      userMessages, supportMessages,
      sendUserMessage, sendSupportMessage, replyToUserMessage,
      markUserMessageRead, markSupportMessageRead,
      deleteSupportMessage, deleteUserMessage,
      unreadUserCount, unreadSupportCount,
    }}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider');
  return ctx;
}
