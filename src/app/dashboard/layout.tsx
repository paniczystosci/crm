// src/app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogOut, User, Menu, X, Sun, Moon, LayoutDashboard, ClipboardList, Users, BarChart3, DollarSign, Plus, Wallet } from 'lucide-react'
import Link from 'next/link'

type Role = 'admin' | 'cleaner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

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

    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  const isAdmin = role === 'admin'

  const adminNavItems = [
    { href: '/dashboard/admin', label: 'Главная', icon: LayoutDashboard },
    { href: '/dashboard/admin/orders', label: 'Заказы', icon: ClipboardList },
    { href: '/dashboard/admin/cleaners', label: 'Клинеры', icon: Users },
    { href: '/dashboard/admin/stats', label: 'Статистика', icon: BarChart3 },
    { href: '/dashboard/admin/payments', label: 'Выплаты', icon: DollarSign },
  ]

  const cleanerNavItems = [
    { href: '/dashboard/cleaner', label: 'Мои заказы', icon: ClipboardList },
    { href: '/dashboard/cleaner/new', label: 'Новый заказ', icon: Plus },
    { href: '/dashboard/cleaner/cash', label: 'Касса', icon: Wallet },
  ]

  const navItems = isAdmin ? adminNavItems : cleanerNavItems

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      
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

          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <User size={14} className="text-white" />
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100% - 280px)' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
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
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-white dark:bg-gray-900">


          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
          >
            <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
            <span className="text-red-600 dark:text-red-400 font-medium">
              Выйти из аккаунта
            </span>
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