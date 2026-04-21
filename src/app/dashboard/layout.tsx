// src/app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogOut, User, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Role = 'admin' | 'cleaner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (profile) setRole(profile.role as Role)
      setLoading(false)
    }
    loadUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-600"></div>
      </div>
    )
  }

  const isAdmin = role === 'admin'

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Надпись в лого */}
            <img
  src="/logo.png"
  alt="Pani Czystości"
  className="h-30 object-contain"
/>

            <div className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">
              {isAdmin ? 'Админ-панель' : 'Панель клинера'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="hidden md:flex items-center gap-3">
              <div className="text-right text-sm">
                <div className="font-medium">{user?.email}</div>
                <div className="text-xs text-zinc-500 capitalize">{role}</div>
              </div>
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <LogOut size={18} /> Выход
            </button>

            {/* Мобильное меню */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-72 border-r border-zinc-200 dark:border-zinc-800 min-h-[calc(100vh-73px)] p-6">
          <nav className="space-y-1">
            {isAdmin ? (
              <>
                <SidebarLink href="/dashboard/admin" icon="🏠" active={pathname === '/dashboard/admin'}>Главная</SidebarLink>
                <SidebarLink href="/dashboard/admin/orders" icon="📋" active={pathname.startsWith('/dashboard/admin/orders')}>Заказы</SidebarLink>
                <SidebarLink href="/dashboard/admin/cleaners" icon="👥" active={pathname === '/dashboard/admin/cleaners'}>Клинеры</SidebarLink>
                <SidebarLink href="/dashboard/admin/stats" icon="📊" active={pathname === '/dashboard/admin/stats'}>Статистика</SidebarLink>
                <SidebarLink href="/dashboard/admin/payments" icon="💰" active={pathname === '/dashboard/admin/payments'}>Выплаты</SidebarLink>
              </>
            ) : (
              <>
                <SidebarLink href="/dashboard/cleaner" icon="📋" active={pathname === '/dashboard/cleaner'}>Мои заказы</SidebarLink>
                <SidebarLink href="/dashboard/cleaner/new" icon="➕" active={pathname === '/dashboard/cleaner/new'}>Новый заказ</SidebarLink>
                <SidebarLink href="/dashboard/cleaner/cash" icon="💰" active={pathname === '/dashboard/cleaner/cash'}>Касса</SidebarLink>
                
              </>
            )}
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black/70 z-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white dark:bg-zinc-900 h-full w-80 p-6" onClick={e => e.stopPropagation()}>
              {/* Здесь можно дублировать ссылки для мобильного меню */}
              <nav className="space-y-2 mt-8">
                {/* Те же ссылки, что и в desktop */}
                {isAdmin ? (
                  <>
                    <MobileSidebarLink href="/dashboard/admin" icon="🏠">Главная</MobileSidebarLink>
                    <MobileSidebarLink href="/dashboard/admin/orders" icon="📋">Заказы</MobileSidebarLink>
                    <MobileSidebarLink href="/dashboard/admin/cleaners" icon="👥">Клинеры</MobileSidebarLink>
                    <MobileSidebarLink href="/dashboard/admin/stats" icon="📊">Статистика</MobileSidebarLink>
                    <MobileSidebarLink href="/dashboard/admin/payments" icon="💰">Выплаты</MobileSidebarLink>
                  </>
                ) : (
                  <>
                    <MobileSidebarLink href="/dashboard/cleaner" icon="📋">Мои заказы</MobileSidebarLink>
                    <MobileSidebarLink href="/dashboard/cleaner/new" icon="➕">Новый заказ</MobileSidebarLink>
                    <MobileSidebarLink href="/dashboard/cleaner/cash" icon="💰">Касса</MobileSidebarLink>
                  </>
                )}
              </nav>
            </div>
          </div>
        )}

        {/* Основной контент */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ href, icon, children, active }: { 
  href: string; 
  icon: string; 
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-medium transition-all ${
        active 
          ? 'bg-green-600 text-white' 
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span>{children}</span>
    </Link>
  )
}

function MobileSidebarLink({ href, icon, children }: { 
  href: string; 
  icon: string; 
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-lg"
      onClick={() => window.history.back()} // закрываем меню после клика
    >
      <span className="text-3xl">{icon}</span>
      <span>{children}</span>
    </Link>
  )
}