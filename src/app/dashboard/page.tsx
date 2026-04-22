// src/app/dashboard/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import NeoCard from '@/components/NeoCard'
import { Users, ClipboardList, TrendingUp, DollarSign, AlertCircle, Package, Calendar, Wallet, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type UnpaidDoneOrder = {
  id: string
  client_name: string
  price: number
  planned_date: string | null
  profiles?: { full_name: string }[] | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    activeCleaners: 0,
    totalRevenue: 0,
  })

  const [unpaidDoneCount, setUnpaidDoneCount] = useState(0)
  const [unpaidDoneOrders, setUnpaidDoneOrders] = useState<UnpaidDoneOrder[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)

    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    const today = new Date().toISOString().split('T')[0]
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('planned_date', today)

    const { count: activeCleaners } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cleaner')

    const { data: revenueData } = await supabase
      .from('orders')
      .select('price')
      .in('status', ['done', 'accepted', 'in_progress'])

    const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.price || 0), 0) || 0

    setStats({
      totalOrders: totalOrders || 0,
      todayOrders: todayOrders || 0,
      activeCleaners: activeCleaners || 0,
      totalRevenue,
    })

    const { count: unpaidCount, data: unpaidData } = await supabase
      .from('orders')
      .select(`
        id,
        client_name,
        price,
        planned_date,
        profiles!cleaner_id (full_name)
      `, { count: 'exact' })
      .eq('status', 'done')
      .eq('is_paid_to_cleaner', false)
      .order('planned_date', { ascending: false })
      .limit(6)

    setUnpaidDoneCount(unpaidCount || 0)
    setUnpaidDoneOrders(unpaidData || [])

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Всего заказов', value: stats.totalOrders, icon: ClipboardList, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Сегодня', value: stats.todayOrders, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Клинеры', value: stats.activeCleaners, icon: Users, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Доход', value: `${stats.totalRevenue} zł`, icon: DollarSign, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  ]

  const quickActions = [
    { title: 'Заказы', description: 'Просмотр и управление', emoji: '📋', href: '/dashboard/admin/orders', color: 'hover:border-blue-200 dark:hover:border-blue-800' },
    { title: 'Клинеры', description: 'Команда и роли', emoji: '👥', href: '/dashboard/admin/cleaners', color: 'hover:border-purple-200 dark:hover:border-purple-800' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Админ‑панель
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Управление системой</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {unpaidDoneCount > 0 && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
          <NeoCard>
            <div className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
              <div className="relative flex flex-col md:flex-row items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <AlertCircle className="text-amber-600 dark:text-amber-400" size={32} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Невыплаченные заказы
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {unpaidDoneCount} заказ{unpaidDoneCount === 1 ? '' : unpaidDoneCount < 5 ? 'а' : 'ов'} ожидают выплаты клинерам
                      </p>
                    </div>
                    <Link
                      href="/dashboard/admin/payments?filter=unpaid"
                      className="group inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Wallet size={18} />
                      <span className="font-medium">Выплатить</span>
                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {unpaidDoneOrders.slice(0, 4).map((order, idx) => (
                      <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">
                            {order.client_name}
                          </div>
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {order.price} zł
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Users size={12} />
                          <span>{order.profiles?.[0]?.full_name || 'Клинер не указан'}</span>
                        </div>
                        {order.planned_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>{new Date(order.planned_date).toLocaleDateString('ru-RU')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </NeoCard>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="group animate-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <NeoCard>
                <div className="relative overflow-hidden">
                  <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${stat.bgColor} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <div className="text-3xl opacity-10 font-bold">#</div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-2xl md:text-3xl font-bold mt-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              </NeoCard>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.href}>
              <div className={`group transition-all duration-300 transform hover:-translate-y-1 ${action.color}`}>
                <NeoCard>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                        {action.emoji}
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                    </div>
                  </div>
                </NeoCard>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>© 2024 Управление клинингом • Все данные обновлены</p>
      </div>
    </div>
  )
}