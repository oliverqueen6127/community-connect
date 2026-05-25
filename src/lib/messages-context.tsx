'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { UserMessage, SupportMessage, SupportReply } from './types';
import { supabase, isSupabaseEnabled } from './supabase';
import { useApp } from './context';

const MESSAGES_KEY = 'cc-user-messages';

// Inline DB types so server-module side effects in supabase.ts aren't triggered in API routes
interface DbSupportMessage {
  id: string; user_id: string | null; from_name: string; from_email: string;
  subject: string; message: string; status: 'unread' | 'read' | 'resolved';
  page: string; created_at: string;
}

interface DbSupportReply {
  id: string; support_message_id: string; sender_role: 'admin' | 'user';
  sender_id: string | null; sender_name: string; message: string;
  read: boolean; created_at: string;
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

function dbToSupportReply(row: DbSupportReply): SupportReply {
  return {
    id: row.id,
    supportMessageId: row.support_message_id,
    senderRole: row.sender_role,
    senderId: row.sender_id ?? undefined,
    senderName: row.sender_name,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

function saveToStorage<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

interface MessagesContextType {
  userMessages: UserMessage[];
  supportMessages: SupportMessage[];
  replies: SupportReply[];
  sendUserMessage: (msg: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => void;
  sendSupportMessage: (msg: Omit<SupportMessage, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  sendReply: (supportMessageId: string, replyText: string) => Promise<void>;
  markUserMessageRead: (id: string) => void;
  markSupportMessageRead: (id: string) => void;
  markReplyRead: (id: string) => void;
  deleteSupportMessage: (id: string) => void;
  deleteUserMessage: (id: string) => void;
  unreadUserCount: (userId: string) => number;
  unreadSupportCount: number;
  unreadReplyCount: number;
  replyToUserMessage: (msg: Omit<UserMessage, 'id' | 'timestamp' | 'read'>) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [replies, setReplies] = useState<SupportReply[]>([]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Load messages when user changes ───────────────────────────────────────
  useEffect(() => {
    setUserMessages(loadFromStorage<UserMessage>(MESSAGES_KEY));
    setSupportMessages([]);
    setReplies([]);

    const u = user;
    if (!u) return;

    const isAdmin = u.id === 'mock-admin-1';
    const isRealUser = !u.id.startsWith('mock-');

    if (isAdmin) {
      // Admin: fetch all support messages + replies via service-key API route
      fetch('/api/support-messages')
        .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
        .then(({ messages, replies: reps }: { messages: SupportMessage[]; replies: SupportReply[] }) => {
          setSupportMessages(messages ?? []);
          setReplies(reps ?? []);
        })
        .catch((err) => console.error('[Messages] admin fetch error:', err));

    } else if (isSupabaseEnabled && supabase && isRealUser) {
      // Regular user: fetch their own support messages + any admin replies
      (async () => {
        const { data: msgData, error: msgErr } = await supabase!
          .from('support_messages')
          .select('*')
          .eq('user_id', u.id)
          .order('created_at', { ascending: false });

        if (msgErr) {
          console.error('[Messages] fetch support_messages error:', msgErr.message);
          return;
        }

        const msgs = (msgData ?? []) as DbSupportMessage[];
        setSupportMessages(msgs.map(dbToSupportMessage));

        if (msgs.length > 0) {
          const ids = msgs.map((m) => m.id);
          const { data: repData, error: repErr } = await supabase!
            .from('support_replies')
            .select('*')
            .in('support_message_id', ids)
            .order('created_at', { ascending: true });

          if (!repErr) {
            setReplies(((repData ?? []) as DbSupportReply[]).map(dbToSupportReply));
          }
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── DM messages (localStorage) ────────────────────────────────────────────
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

  const markUserMessageRead = useCallback((id: string) => {
    setUserMessages((prev) => {
      const updated = prev.map((m) => m.id === id ? { ...m, read: true } : m);
      saveToStorage(MESSAGES_KEY, updated);
      return updated;
    });
  }, []);

  const deleteUserMessage = useCallback((id: string) => {
    setUserMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveToStorage(MESSAGES_KEY, updated);
      return updated;
    });
  }, []);

  // ── Support messages (Supabase) ───────────────────────────────────────────
  const sendSupportMessage = useCallback(async (msg: Omit<SupportMessage, 'id' | 'timestamp' | 'read'>) => {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase not configured — support messages unavailable.');
    }

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: msg.fromUserId || null,
        from_name: msg.fromUserName,
        from_email: msg.fromUserEmail,
        subject: msg.subject || '',
        message: msg.content,
        page: msg.page || '',
        status: 'unread',
      })
      .select()
      .single();

    if (error) {
      console.error('[Support] Supabase insert failed:', error.message);
      throw new Error(error.message);
    }

    setSupportMessages((prev) => [dbToSupportMessage(data as DbSupportMessage), ...prev]);
  }, []);

  // sendReply — admin only; goes through service-key API route
  const sendReply = useCallback(async (supportMessageId: string, replyText: string) => {
    const res = await fetch('/api/support-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supportMessageId, message: replyText }),
    });

    const json = await res.json() as { reply?: SupportReply; error?: string };
    if (!res.ok || json.error) {
      console.error('[sendReply] failed:', json.error);
      throw new Error(json.error ?? 'Reply failed');
    }

    if (json.reply) {
      setReplies((prev) => [...prev, json.reply!]);
    }
    // Mark the support message as read in local state
    setSupportMessages((prev) =>
      prev.map((m) => m.id === supportMessageId ? { ...m, read: true } : m),
    );
  }, []);

  const markSupportMessageRead = useCallback((id: string) => {
    setSupportMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));

    const u = userRef.current;
    if (u?.id === 'mock-admin-1') {
      fetch('/api/support-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'read' }),
      }).catch((err) => console.error('[markSupportMessageRead]', err));
    } else if (isSupabaseEnabled && supabase) {
      supabase.from('support_messages').update({ status: 'read' }).eq('id', id)
        .then(({ error }) => { if (error) console.error('[markSupportMessageRead]', error.message); });
    }
  }, []);

  const markReplyRead = useCallback((id: string) => {
    setReplies((prev) => prev.map((r) => r.id === id ? { ...r, read: true } : r));

    if (isSupabaseEnabled && supabase) {
      supabase.from('support_replies').update({ read: true }).eq('id', id)
        .then(({ error }) => { if (error) console.error('[markReplyRead]', error.message); });
    }
  }, []);

  const deleteSupportMessage = useCallback((id: string) => {
    setSupportMessages((prev) => prev.filter((m) => m.id !== id));
    setReplies((prev) => prev.filter((r) => r.supportMessageId !== id));

    const u = userRef.current;
    if (u?.id === 'mock-admin-1') {
      fetch('/api/support-messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch((err) => console.error('[deleteSupportMessage] admin DELETE failed:', err));
    } else if (isSupabaseEnabled && supabase) {
      supabase.from('support_messages').delete().eq('id', id)
        .then(({ error }) => { if (error) console.error('[deleteSupportMessage]', error.message); });
    }
  }, []);

  const unreadUserCount = useCallback((userId: string) =>
    userMessages.filter((m) => m.toUserId === userId && !m.read).length,
  [userMessages]);

  const unreadSupportCount = supportMessages.filter((m) => !m.read).length;
  const unreadReplyCount = replies.filter((r) => r.senderRole === 'admin' && !r.read).length;

  return (
    <MessagesContext.Provider value={{
      userMessages, supportMessages, replies,
      sendUserMessage, sendSupportMessage, sendReply, replyToUserMessage,
      markUserMessageRead, markSupportMessageRead, markReplyRead,
      deleteSupportMessage, deleteUserMessage,
      unreadUserCount, unreadSupportCount, unreadReplyCount,
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
