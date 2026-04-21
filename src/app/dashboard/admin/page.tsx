// src/app/dashboard/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Users, ClipboardList, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'

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
    totalRevenue: 0,        // валовой доход
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

    // 1. Основная статистика
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

    // 2. Невыплаченные завершённые заказы (самое важное для Шага 2)
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Админ-панель</h1>

      {/* === АЛЕРТ: Невыплаченные завершённые заказы === */}
      {unpaidDoneCount > 0 && (
        <div className="card border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/30 p-6 mb-10">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-amber-600 mt-1" size={28} />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-amber-700 dark:text-amber-400">
                Есть завершённые заказы без выплаты клинерам
              </h2>
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                {unpaidDoneCount} заказ{unpaidDoneCount === 1 ? '' : 'а'} уже завершены, 
                но деньги клинерам ещё не выплачены.
              </p>

              {/* Мини-список последних 3–4 заказов */}
              <div className="mt-6 space-y-3">
                {unpaidDoneOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-800"
                  >
                    <div>
                      <div className="font-medium">{order.client_name}</div>
                      <div className="text-sm text-zinc-500">
                        {order.profiles?.[0]?.full_name 
                          ? `Клинер: ${order.profiles[0].full_name}` 
                          : 'Клинер не указан'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-600">{order.price} zł</div>
                      {order.planned_date && (
                        <div className="text-xs text-zinc-500">
                          {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/dashboard/admin/payments?filter=unpaid"
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-medium whitespace-nowrap transition-colors mt-2"
            >
              Перейти к выплатам →
            </Link>
          </div>
        </div>
      )}

      {/* Статистика карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-sm">Всего заказов</p>
              <p className="text-5xl font-bold mt-2">{stats.totalOrders}</p>
            </div>
            <ClipboardList className="text-blue-600" size={48} />
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-sm">Заказы на сегодня</p>
              <p className="text-5xl font-bold mt-2">{stats.todayOrders}</p>
            </div>
            <TrendingUp className="text-emerald-600" size={48} />
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-sm">Клинеры</p>
              <p className="text-5xl font-bold mt-2">{stats.activeCleaners}</p>
            </div>
            <Users className="text-blue-600" size={48} />
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-sm">Валовой доход</p>
              <p className="text-5xl font-bold mt-2">{stats.totalRevenue} zł</p>
            </div>
            <DollarSign className="text-amber-600" size={48} />
          </div>
        </div>
      </div>

      {/* Быстрые ссылки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href="/dashboard/admin/orders" className="card p-8 hover:shadow-xl transition-all group">
          <div className="text-6xl mb-6">📋</div>
          <h3 className="text-3xl font-semibold mb-2">Управление заказами</h3>
          <p className="text-zinc-500">Просмотр, редактирование и назначение всех заказов</p>
          <div className="mt-6 text-green-600 group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
            Перейти к заказам →
          </div>
        </Link>

        <Link href="/dashboard/admin/cleaners" className="card p-8 hover:shadow-xl transition-all group">
          <div className="text-6xl mb-6">👥</div>
          <h3 className="text-3xl font-semibold mb-2">Управление клинерами</h3>
          <p className="text-zinc-500">Список команды, статистика и роли</p>
          <div className="mt-6 text-green-600 group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
            Перейти к клинерам →
          </div>
        </Link>
      </div>
    </div>
  )
}