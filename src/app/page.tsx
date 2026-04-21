// src/app/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function Home() {
  try {
    const supabase = await createClient()
    
    // Проверка на null/undefined
    if (!supabase || !supabase.auth) {
      console.error('Supabase client or auth is not available')
      redirect('/auth/login')
    }
    
    const response = await supabase.auth.getUser()
    const { data, error } = response
    
    if (error || !data?.user) {
      redirect('/auth/login')
    } else {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    redirect('/auth/login')
  }
}