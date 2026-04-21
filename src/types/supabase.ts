// src/types/supabase.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'cleaner'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'cleaner'
        }
        Update: {
          full_name?: string | null
          role?: 'admin' | 'cleaner'
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          client_name: string
          client_phone: string
          address: string
          google_maps_link?: string | null
          comment?: string | null
          price: number
          status: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
          planned_date?: string | null
          planned_time?: string | null
          cleaner_id?: string | null
          salary_type?: 'fixed' | 'percent' | 'fixed_plus_percent' | 'manual' | null
          salary_value?: number | null
          is_paid_to_cleaner: boolean
          paid_at?: string | null
        }
        Insert: {
          client_name: string
          client_phone: string
          address: string
          google_maps_link?: string | null
          comment?: string | null
          price: number
          status?: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
          planned_date?: string | null
          planned_time?: string | null
          cleaner_id?: string | null
          salary_type?: 'fixed' | 'percent' | 'fixed_plus_percent' | 'manual' | null
          salary_value?: number | null
        }
        Update: {
          status?: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
          planned_date?: string | null
          planned_time?: string | null
          // и т.д.
        }
      }
      order_messages: {
        Row: {
          id: string
          order_id: string
          author_id: string
          message: string
          image_url?: string | null
          created_at: string
        }
        Insert: {
          order_id: string
          author_id: string
          message: string
          image_url?: string | null
        }
      }
    }
  }
}