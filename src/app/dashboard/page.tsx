// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function DashboardRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Важно: проверяем роль и перенаправляем
  if (profile?.role === 'admin') {
    redirect('/dashboard/admin')
  } else {
    redirect('/dashboard/cleaner') // <- клинер должен идти сюда
  }
}