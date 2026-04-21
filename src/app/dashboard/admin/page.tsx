// src/app/(dashboard)/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Users, ClipboardList, TrendingUp, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    activeCleaners: 0,
    totalRevenue: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    // Общее количество заказов
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Заказы сегодня
    const today = new Date().toISOString().split('T')[0]
    const { count: todayOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('planned_date', today)

    // Активные клинеры
    const { count: activeCleaners } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cleaner')

    // Суммарный доход (примерно)
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
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-10">Админ-панель</h1>

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
              <p className="text-zinc-500 text-sm">Доход (примерно)</p>
              <p className="text-5xl font-bold mt-2">{stats.totalRevenue} zł</p>
            </div>
            <DollarSign className="text-amber-600" size={48} />
          </div>
        </div>
      </div>

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