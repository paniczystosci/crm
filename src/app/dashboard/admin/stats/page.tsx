// src/app/dashboard/admin/stats/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type MonthlyData = {
  month: string
  revenue: number
  orders: number
}

type StatusData = {
  name: string
  value: number
  color: string
}

type RecentPayout = {
  order_id: string
  client_name: string
  cleaner_name: string
  amount: number
  paid_at: string
}

export default function AdminStats() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)     // валовой
  const [totalPayouts, setTotalPayouts] = useState(0)     // выплачено клинерам
  const [netRevenue, setNetRevenue] = useState(0)         // чистый доход
  const [totalOrders, setTotalOrders] = useState(0)
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchStatistics()
  }, [])

  async function fetchStatistics() {
    setLoading(true)

    // 1. Получаем все нужные заказы с join на профиль клинера
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        price,
        status,
        created_at,
        client_name,
        cleaner_id,
        salary_value,
        is_paid_to_cleaner,
        paid_at,
        profiles!cleaner_id (full_name)
      `)
      .in('status', ['done', 'accepted', 'in_progress'])

    const ordersList = orders || []

    // 2. Валовой доход
    const gross = ordersList.reduce((sum, o) => sum + (o.price || 0), 0)
    setTotalRevenue(gross)
    setTotalOrders(ordersList.length)

    // 3. Выплаты клинерам (только уже выплаченные)
    const paidOrders = ordersList.filter(
      (o) => o.is_paid_to_cleaner && o.salary_value !== null && o.salary_value > 0
    )
    const payoutsSum = paidOrders.reduce((sum, o) => sum + (o.salary_value || 0), 0)
    setTotalPayouts(payoutsSum)
    setNetRevenue(gross - payoutsSum)

    // 4. Последние выплаты (для отображения)
    const recent = paidOrders
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())
      .slice(0, 8)
      .map((o) => ({
        order_id: o.id,
        client_name: o.client_name,
        cleaner_name: o.profiles?.full_name || 'Неизвестный клинер',
        amount: o.salary_value!,
        paid_at: o.paid_at!,
      }))
    setRecentPayouts(recent)

    // 5. Данные по месяцам (как было раньше)
    const monthlyMap = new Map<string, { revenue: number; orders: number }>()
    ordersList.forEach((order) => {
      const date = new Date(order.created_at)
      const monthKey = date.toLocaleString('ru-RU', { month: 'short', year: 'numeric' })

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { revenue: 0, orders: 0 })
      }
      const current = monthlyMap.get(monthKey)!
      current.revenue += order.price || 0
      current.orders += 1
    })

    const sortedMonthly = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)

    setMonthlyData(sortedMonthly)

    // 6. Pie Chart — распределение по статусам
    const statusCount = ordersList.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    const pieData: StatusData[] = [
      { name: 'Завершён', value: statusCount.done || 0, color: '#10b981' },
      { name: 'В работе', value: statusCount.in_progress || 0, color: '#f59e0b' },
      { name: 'Принят', value: statusCount.accepted || 0, color: '#3b82f6' },
      { name: 'Новый', value: statusCount.new || 0, color: '#8b5cf6' },
    ].filter((item) => item.value > 0)

    setStatusData(pieData)

    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-20 text-xl">Загрузка статистики...</div>
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold mb-2">Статистика и отчёты</h1>
        <p className="text-zinc-500">Доходы, выплаты и анализ</p>
      </div>

      {/* Ключевые показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-8">
          <p className="text-zinc-500 text-sm">Валовой доход</p>
          <p className="text-5xl font-bold mt-3 text-emerald-600">{totalRevenue} zł</p>
        </div>

        <div className="card p-8">
          <p className="text-zinc-500 text-sm">Выплачено клинерам</p>
          <p className="text-5xl font-bold mt-3 text-rose-600">-{totalPayouts} zł</p>
        </div>

        <div className="card p-8 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            ЧИСТЫЙ ДОХОД
          </p>
          <p className="text-5xl font-bold mt-3 text-emerald-700">{netRevenue} zł</p>
        </div>

        <div className="card p-8">
          <p className="text-zinc-500 text-sm">Всего заказов</p>
          <p className="text-5xl font-bold mt-3">{totalOrders}</p>
        </div>
      </div>

      {/* Последние выплаты */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold mb-6">Последние выплаты клинерам</h2>
        <div className="space-y-4">
          {recentPayouts.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">Пока нет выплат</p>
          ) : (
            recentPayouts.map((p) => (
              <div
                key={p.order_id}
                className="flex justify-between items-center py-4 border-b last:border-none"
              >
                <div className="flex-1">
                  <div className="font-medium">{p.cleaner_name}</div>
                  <div className="text-sm text-zinc-500">
                    Заказ #{p.order_id.slice(0, 8).toUpperCase()} — {p.client_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-rose-600 text-xl">-{p.amount} zł</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(p.paid_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* График доходов и заказов по месяцам */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold mb-6">Доход и количество заказов по месяцам</h2>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#e11d48"
              strokeWidth={4}
              name="Доход (zł)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Заказы"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart — Заказы по месяцам */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-6">Количество заказов по месяцам</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#8b5cf6" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Распределение статусов */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-6">Распределение заказов по статусам</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                dataKey="value"
                label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}