// src/types/supabase.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: 'admin' | 'cleaner'
          payout_rate: string          // '15', '25', '50', 'manual'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: 'admin' | 'cleaner'
          payout_rate?: string
        }
        Update: {
          full_name?: string | null
          role?: 'admin' | 'cleaner'
          payout_rate?: string
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

          // Поля для расчёта зарплаты клинера
          salary_type?: 'fixed' | 'percent' | 'fixed_plus_percent' | 'manual' | null
          salary_value?: number | null
          is_paid_to_cleaner: boolean
          paid_at?: string | null

          // ← НОВЫЕ ПОЛЯ ДЛЯ ПРИЁМА ОПЛАТЫ И ИНКАССАЦИИ
          cash_received?: number | null          // сколько наличных принял клинер
          bank_received?: number | null          // сколько оплатил клиент на счёт фирмы
          change_given?: number | null           // сдача клиенту (при оплате наличными)
          payment_accepted_at?: string | null    // когда была принята оплата
          is_incassed?: boolean                  // true = админ подтвердил инкассацию
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
          is_paid_to_cleaner?: boolean
          paid_at?: string | null

          cash_received?: number | null
          bank_received?: number | null
          change_given?: number | null
          payment_accepted_at?: string | null
          is_incassed?: boolean
        }
        Update: {
          status?: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
          planned_date?: string | null
          planned_time?: string | null
          cleaner_id?: string | null

          salary_type?: 'fixed' | 'percent' | 'fixed_plus_percent' | 'manual' | null
          salary_value?: number | null
          is_paid_to_cleaner?: boolean
          paid_at?: string | null

          cash_received?: number | null
          bank_received?: number | null
          change_given?: number | null
          payment_accepted_at?: string | null
          is_incassed?: boolean
        }
      }

      order_messages: {
        Row: {
          id: string
          order_id: string
          author_id: string
          message: string | null
          image_url?: string | null
          created_at: string
        }
        Insert: {
          order_id: string
          author_id: string
          message?: string | null
          image_url?: string | null
        }
        Update: {
          message?: string | null
          image_url?: string | null
        }
      }
    }
  }
}