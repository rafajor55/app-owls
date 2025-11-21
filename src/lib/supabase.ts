import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          city: string | null;
          instagram: string | null;
          is_admin: boolean;
          is_blocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          city?: string | null;
          instagram?: string | null;
          is_admin?: boolean;
          is_blocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          city?: string | null;
          instagram?: string | null;
          is_admin?: boolean;
          is_blocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      rides: {
        Row: {
          id: string;
          user_id: string;
          platform: 'uber' | '99' | 'indriver';
          date: string;
          value: number;
          distance: number | null;
          duration: number | null;
          category: string | null;
          bonus: number;
          multiplier: number;
          total_earnings: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: 'uber' | '99' | 'indriver';
          date?: string;
          value: number;
          distance?: number | null;
          duration?: number | null;
          category?: string | null;
          bonus?: number;
          multiplier?: number;
          total_earnings: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: 'uber' | '99' | 'indriver';
          date?: string;
          value?: number;
          distance?: number | null;
          duration?: number | null;
          category?: string | null;
          bonus?: number;
          multiplier?: number;
          total_earnings?: number;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          fuel: number;
          food: number;
          toll: number;
          other: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          fuel?: number;
          food?: number;
          toll?: number;
          other?: number;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          fuel?: number;
          food?: number;
          toll?: number;
          other?: number;
          total?: number;
          created_at?: string;
        };
      };
      online_sessions: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          city: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          city: string;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          city?: string;
          message?: string;
          created_at?: string;
        };
      };
    };
  };
};
