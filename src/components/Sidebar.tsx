// src/components/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  DollarSign, 
  BarChart3, 
  LogOut, 
  X,
  Settings,
  Plus
} from 'lucide-react'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<'admin' | 'cleaner' | null>(null)
  const { totalUnread } = useUnreadMessages()

  // Загружаем роль пользователя
  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        setUserRole(profile.role as 'admin' | 'cleaner')
      }
    }

    getUserRole()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Пока роль не загрузилась — показываем загрузку
  if (!userRole) {
    return (
      <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 flex items-center justify-center ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const adminNavItems = [
    { href: '/dashboard/admin', label: 'Главная', icon: LayoutDashboard },
    { href: '/dashboard/admin/orders', label: 'Заказы', icon: ClipboardList, showNotification: true },
    { href: '/dashboard/admin/cleaners', label: 'Клинеры', icon: Users },
    { href: '/dashboard/admin/payments', label: 'Выплаты', icon: DollarSign },
    { href: '/dashboard/admin/stats', label: 'Статистика', icon: BarChart3 },
  ]

  const cleanerNavItems = [
    { href: '/dashboard/cleaner', label: 'Мои заказы', icon: ClipboardList, showNotification: true },
    { href: '/dashboard/cleaner/new', label: 'Новый заказ', icon: Plus },
    { href: '/dashboard/cleaner/cash', label: 'Касса', icon: DollarSign },
  ]

  const navItems = userRole === 'admin' ? adminNavItems : cleanerNavItems

  return (
    <>
      {/* Оверлей */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Боковое меню */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">П</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pani Czystości</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userRole === 'admin' ? 'Администратор' : 'Клинер'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const showNotification = item.showNotification && totalUnread > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-500'} />
                <span className="font-medium flex-1">{item.label}</span>
                
                {showNotification && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </div>
                )}
              </Link>
            )
          })}

          {/* Настройки */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                pathname === '/dashboard/settings' 
                  ? 'bg-emerald-600 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Settings size={22} />
              <span className="font-medium">Настройки</span>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950 text-red-600 font-medium transition-colors"
          >
            <LogOut size={20} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  )
}