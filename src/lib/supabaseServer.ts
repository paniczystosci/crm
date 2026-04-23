// src/lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Метод getAll используется для ЧТЕНИЯ кук
        getAll() {
          return cookieStore.getAll()
        },
        // Метод setAll будет вызван, но в Server Component он не должен ничего делать
        // Вся запись происходит в middleware.ts
        setAll() {
          // Пустая функция, так как запись происходит в middleware
        },
      },
    }
  )
}