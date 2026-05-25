import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function initClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Supabase] createClient failed:', err);
    }
    return null;
  }
}

export const supabase: SupabaseClient | null = initClient();
export const isSupabaseEnabled = supabase !== null;

// Always log so we can debug production issues via browser console
console.log('[Supabase] configured:', isSupabaseEnabled, '| url:', url ?? '(missing)', '| key prefix:', anonKey ? anonKey.slice(0, 20) + '...' : '(missing)');

// ── DB row types ──────────────────────────────────────────────────────────────

export interface DbProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

export interface DbFavorite {
  id:           string;
  user_id:      string;
  listing_id:   string;
  listing_type: 'business' | 'event' | 'housing' | 'job';
  created_at:   string;
}

export interface DbSupportMessage {
  id: string;
  user_id: string | null;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'resolved';
  page: string;
  created_at: string;
}

export interface DbSupportReply {
  id: string;
  support_message_id: string;
  sender_role: 'admin' | 'user';
  sender_id: string | null;
  sender_name: string;
  message: string;
  read: boolean;
  created_at: string;
}
