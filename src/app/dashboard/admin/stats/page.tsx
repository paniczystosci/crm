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
import { TrendingUp, TrendingDown, DollarSign, Package, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'

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

const statusColorsMap = {
  done: '#10b981',
  in_progress: '#f59e0b',
  accepted: '#3b82f6',
  new: '#8b5cf6',
  cancelled: '#ef4444',
}

export default function AdminStats() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalPayouts, setTotalPayouts] = useState(0)
  const [netRevenue, setNetRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchStatistics()
  }, [])

  async function fetchStatistics() {
    setLoading(true)

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

    const gross = ordersList.reduce((sum, o) => sum + (o.price || 0), 0)
    setTotalRevenue(gross)
    setTotalOrders(ordersList.length)

    const paidOrders = ordersList.filter(
      (o) => o.is_paid_to_cleaner && o.salary_value !== null && o.salary_value > 0
    )
    const payoutsSum = paidOrders.reduce((sum, o) => sum + (o.salary_value || 0), 0)
    setTotalPayouts(payoutsSum)
    setNetRevenue(gross - payoutsSum)

    const recent = paidOrders
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())
      .slice(0, 8)
      .map((o) => ({
        order_id: o.id,
        client_name: o.client_name,
        cleaner_name: o.profiles?.[0]?.full_name || 'Неизвестный клинер',
        amount: o.salary_value!,
        paid_at: o.paid_at!,
      }))
    setRecentPayouts(recent)

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

    const statusCount = ordersList.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    const pieData: StatusData[] = [
      { name: 'Завершён', value: statusCount.done || 0, color: statusColorsMap.done },
      { name: 'В работе', value: statusCount.in_progress || 0, color: statusColorsMap.in_progress },
      { name: 'Принят', value: statusCount.accepted || 0, color: statusColorsMap.accepted },
      { name: 'Новый', value: statusCount.new || 0, color: statusColorsMap.new },
    ].filter((item) => item.value > 0)

    setStatusData(pieData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  const netRevenuePercent = totalRevenue > 0 ? (netRevenue / totalRevenue * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Статистика и отчёты
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-13">
            Доходы, выплаты и анализ эффективности
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Gross Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <TrendingUp size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Валовой доход</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRevenue} zł</p>
            <p className="text-xs text-gray-400 mt-2">за все время</p>
          </div>

          {/* Payouts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <TrendingDown size={20} className="text-rose-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Выплачено клинерам</p>
            <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">-{totalPayouts} zł</p>
            <p className="text-xs text-gray-400 mt-2">выплаченные суммы</p>
          </div>

          {/* Net Revenue */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium">+{netRevenuePercent}%</span>
              </div>
              <p className="text-emerald-100 text-sm mb-1">Чистый доход</p>
              <p className="text-4xl font-bold text-white">{netRevenue} zł</p>
              <p className="text-emerald-200 text-xs mt-2">после выплат клинерам</p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <Calendar size={20} className="text-blue-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Всего заказов</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
            <p className="text-xs text-gray-400 mt-2">выполненных и активных</p>
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet size={20} className="text-rose-500" />
              Последние выплаты клинерам
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentPayouts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex flex-col items-center gap-3">
                  <Wallet size={48} className="text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Пока нет выплат</p>
                </div>
              </div>
            ) : (
              recentPayouts.map((p, idx) => (
                <div
                  key={p.order_id}
                  className="p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 animate-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">
                          {p.cleaner_name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{p.cleaner_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Заказ #{p.order_id.slice(0, 8).toUpperCase()} — {p.client_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="font-bold text-rose-600 dark:text-rose-400 text-xl">-{p.amount} zł</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(p.paid_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue & Orders Line Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              Доход и количество заказов по месяцам
            </h2>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e11d48"
                  strokeWidth={3}
                  name="Доход (zł)"
                  dot={{ fill: '#e11d48', strokeWidth: 2 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Заказы"
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Package size={20} className="text-purple-500" />
              Количество заказов по месяцам
            </h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            Распределение заказов по статусам
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            <div className="w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2024 Управление клинингом • Аналитика и отчёты</p>
        </div>
      </div>
    </div>
  )
}