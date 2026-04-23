// src/lib/supabaseClient.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Используем hardcoded значения для теста на Vercel
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdcreuggkwfnotimmehv.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkY3JldWdna3dmbm90aW1tZWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4OTUwNjksImV4cCI6MjA1NzQ3MTA2OX0.pjWgL1sNzN6P6wMQqDjmNwvQk3MjS8o-v8zVhMq3XmE'
  
  return createBrowserClient(url, key)
}