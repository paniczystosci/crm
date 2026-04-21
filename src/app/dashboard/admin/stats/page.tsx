// src/app/(dashboard)/admin/stats/page.tsx
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

export default function AdminStats() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchStatistics()
  }, [])

  async function fetchStatistics() {
    setLoading(true)

    // 1. Доход и количество заказов по месяцам (последние 6 месяцев)
    const { data: orders } = await supabase
      .from('orders')
      .select('price, created_at, status')
      .in('status', ['done', 'accepted', 'in_progress']) // только релевантные

    const monthlyMap = new Map<string, { revenue: number; orders: number }>()

    orders?.forEach((order) => {
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
      .slice(-6) // последние 6 месяцев

    setMonthlyData(sortedMonthly)

    // 2. Общая статистика
    const totalRev = orders?.reduce((sum, o) => sum + (o.price || 0), 0) || 0
    setTotalRevenue(totalRev)
    setTotalOrders(orders?.length || 0)

    // 3. Распределение по статусам (Pie Chart)
    const statusCount = orders?.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {}) || {}

    const pieData: StatusData[] = [
      { name: 'Завершён', value: statusCount.done || 0, color: '#10b981' },
      { name: 'В работе', value: statusCount.in_progress || 0, color: '#f59e0b' },
      { name: 'Принят', value: statusCount.accepted || 0, color: '#3b82f6' },
      { name: 'Новый', value: statusCount.new || 0, color: '#8b5cf6' },
    ].filter(item => item.value > 0)

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
        <p className="text-zinc-500">Доходы, заказы и анализ за период</p>
      </div>

      {/* Ключевые показатели */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-8">
          <p className="text-zinc-500">Общий доход</p>
          <p className="text-5xl font-bold mt-3 text-emerald-600">{totalRevenue} zł</p>
        </div>
        <div className="card p-8">
          <p className="text-zinc-500">Всего заказов</p>
          <p className="text-5xl font-bold mt-3">{totalOrders}</p>
        </div>
        <div className="card p-8">
          <p className="text-zinc-500">Средний чек</p>
          <p className="text-5xl font-bold mt-3">
            {totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0} zł
          </p>
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