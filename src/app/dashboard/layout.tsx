// src/app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  LogOut, User, Menu, X, LayoutDashboard, ClipboardList, 
  Users, BarChart3, DollarSign, Plus, Wallet, Bell, Settings 
} from 'lucide-react'
import Link from 'next/link'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { NotificationSound } from '@/components/NotificationSound'
import { GlobalNotifications } from '@/components/GlobalNotifications'

type Role = 'admin' | 'cleaner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const { totalUnread } = useUnreadMessages()

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Закрытие user menu при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuOpen && !(e.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [userMenuOpen])

  // Загрузка пользователя и роли
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

      if (profile) {
        setRole(profile.role as Role)
      }
      setLoading(false)
    }
    loadUser()
  }, [router, supabase])

  // Защита роутов — перенаправление при несоответствии роли
  useEffect(() => {
    if (!role) return

    if (role === 'cleaner' && pathname.startsWith('/dashboard/admin')) {
      router.replace('/dashboard/cleaner')
    } else if (role === 'admin' && pathname.startsWith('/dashboard/cleaner')) {
      router.replace('/dashboard/admin')
    }
  }, [role, pathname, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const isAdmin = role === 'admin'

  const adminNavItems = [
    { href: '/dashboard/admin', label: 'Главная', icon: LayoutDashboard, showNotification: false },
    { href: '/dashboard/admin/orders', label: 'Заказы', icon: ClipboardList, showNotification: true },
    { href: '/dashboard/admin/cleaners', label: 'Клинеры', icon: Users, showNotification: false },
    { href: '/dashboard/admin/stats', label: 'Статистика', icon: BarChart3, showNotification: false },
    { href: '/dashboard/admin/payments', label: 'Выплаты', icon: DollarSign, showNotification: false },
  ]

  const cleanerNavItems = [
    { href: '/dashboard/cleaner', label: 'Мои заказы', icon: ClipboardList, showNotification: true },
    { href: '/dashboard/cleaner/new', label: 'Новый заказ', icon: Plus, showNotification: false },
    { href: '/dashboard/cleaner/cash', label: 'Касса', icon: Wallet, showNotification: false },
  ]

  const navItems = isAdmin ? adminNavItems : cleanerNavItems

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      
      {/* Уведомления */}
      <GlobalNotifications />
      <NotificationSound />

      {/* Top Navbar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Pani Czystości"
                className="h-10 md:h-12 object-contain"
              />
              <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                {isAdmin ? 'Админ-панель' : 'Панель клинера'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Уведомления */}
            <div className="relative">
              <button 
                onClick={() => router.push(isAdmin ? '/dashboard/admin/orders' : '/dashboard/cleaner')}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              >
                <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                {totalUnread > 0 && (
                  <>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-5 px-1.5 flex items-center justify-center shadow-lg animate-pulse">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  </>
                )}
              </button>
            </div>

            {/* User Menu */}
            <div className="relative user-menu">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                  <User size={14} className="text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.email?.split('@')[0] || 'Профиль'}
                </span>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.email?.split('@')[0] || 'Пользователь'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setSidebarOpen(false)
                    }}
                  >
                    <Settings size={16} />
                    <span>Настройки</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-t border-gray-100 dark:border-gray-700 mt-1"
                  >
                    <LogOut size={16} />
                    <span>Выйти из аккаунта</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">П</span>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Pani Czystości
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isAdmin ? 'Администратор' : 'Клинер'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* User Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {user?.email?.split('@')[0] || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100% - 320px)' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const showNotification = item.showNotification && totalUnread > 0
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-500'} />
                <span className="font-medium flex-1">{item.label}</span>
                
                {showNotification && (
                  <div className="relative">
                    <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg animate-pulse">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
                
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            )
          })}

          {/* Настройки */}
          <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard/settings"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === '/dashboard/settings'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Settings size={20} className={pathname === '/dashboard/settings' ? 'text-white' : 'text-gray-500 group-hover:text-emerald-500'} />
              <span className="font-medium flex-1">Настройки</span>
              {pathname === '/dashboard/settings' && (
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              )}
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium transition-all duration-200 transform active:scale-[0.98] shadow-md relative overflow-hidden group"
          >
            <div className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></div>
            <LogOut size={20} className="relative z-10" />
            <span className="relative z-10">Выйти из аккаунта</span>
          </button>

          <div className="px-4 pt-4 text-center">
            <p className="text-xs text-gray-400">© 2026 Pani Czystości</p>
            <p className="text-xs text-gray-400 mt-0.5">Версия 2.0.0</p>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {children}
      </main>
    </div>
  )
}