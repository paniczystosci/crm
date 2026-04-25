// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Получаем роль пользователя
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/dashboard/admin')
  } else {
    redirect('/dashboard/cleaner') // ← измени, если у тебя другая страница для клинера
  }
}