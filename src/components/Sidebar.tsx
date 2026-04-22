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
  Moon,
  Sun,
  Bell,
  MessageCircle
} from 'lucide-react'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

const adminNavItems = [
  { href: '/dashboard/admin', label: 'Главная', icon: LayoutDashboard },
  { href: '/dashboard/admin/orders', label: 'Заказы', icon: ClipboardList },
  { href: '/dashboard/admin/cleaners', label: 'Клинеры', icon: Users },
  { href: '/dashboard/admin/payments', label: 'Выплаты', icon: DollarSign },
  { href: '/dashboard/admin/stats', label: 'Статистика', icon: BarChart3 },
]

const cleanerNavItems = [
  { href: '/dashboard/cleaner', label: 'Главная', icon: LayoutDashboard },
  { href: '/dashboard/cleaner/orders', label: 'Мои заказы', icon: ClipboardList },
  { href: '/dashboard/cleaner/new', label: 'Новый заказ', icon: ClipboardList },
  { href: '/dashboard/cleaner/cash', label: 'Касса', icon: DollarSign },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isDark, setIsDark] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'cleaner'>('cleaner')
  const { totalUnread } = useUnreadMessages()

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)

    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role === 'admin') {
          setUserRole('admin')
        }
      }
    }
    getUserRole()
  }, [supabase])

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navItems = userRole === 'admin' ? adminNavItems : cleanerNavItems

  return (
    <>
      {/* Оверлей */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Боковое меню */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">П</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Pani Czystości
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {userRole === 'admin' ? 'Администратор' : 'Клинер'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100% - 280px)' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            // Показываем уведомления только для страницы заказов
            const showNotification = item.label === 'Заказы' && totalUnread > 0
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-500'} />
                <span className="font-medium flex-1">{item.label}</span>
                
                {/* Бейдж с количеством непрочитанных сообщений */}
                {showNotification && (
                  <div className="relative">
                    <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg animate-pulse">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </div>
                    {/* Анимированная точка для привлечения внимания */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
                
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-white dark:bg-gray-900">
          {/* Theme Toggle */}


          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
          >
            <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
            <span className="text-red-600 dark:text-red-400 font-medium">
              Выйти из аккаунта
            </span>
          </button>

          {/* Version */}
          <div className="px-4 pt-4 text-center">
            <p className="text-xs text-gray-400">© 2024 Pani Czystości</p>
            <p className="text-xs text-gray-400 mt-0.5">Версия 2.0.0</p>
          </div>
        </div>
      </div>
    </>
  )
}