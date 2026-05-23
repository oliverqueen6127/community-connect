import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role: 'user' | 'admin';
          saved_businesses: string[];
          saved_events: string[];
          saved_housing: string[];
          saved_jobs: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          saved_businesses?: string[];
          saved_events?: string[];
          saved_housing?: string[];
          saved_jobs?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          saved_businesses?: string[];
          saved_events?: string[];
          saved_housing?: string[];
          saved_jobs?: string[];
        };
      };
      ai_searches: {
        Row: {
          id: string;
          user_id: string | null;
          query: string;
          response: string;
          results_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          query: string;
          response: string;
          results_count: number;
          created_at?: string;
        };
        Update: never;
      };
    };
  };
}
