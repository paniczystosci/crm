// src/app/dashboard/admin/payments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { Check, X, Calendar, User, DollarSign, Wallet, CreditCard, Clock, AlertCircle, TrendingUp } from 'lucide-react'

type PaymentOrder = {
  id: string
  client_name: string
  price: number
  planned_date?: string
  cleaner_id?: string
  salary_type?: string
  salary_value?: number | null
  is_paid_to_cleaner: boolean
  paid_at?: string
  profiles?: { 
    full_name: string 
    payout_rate: string
  } | null
}

export default function AdminPayments() {
  const t = useTranslations('common')
  const paymentsT = useTranslations('payments')
  const ordersT = useTranslations('orders')
  const cleanersT = useTranslations('cleaners')
  const errorsT = useTranslations('errors')
  
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [manualSalary, setManualSalary] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid')
  const [loading, setLoading] = useState(true)
  const [totalToPay, setTotalToPay] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchPayments()
  }, [filter])

  async function fetchPayments() {
    setLoading(true)

    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!cleaner_id (full_name, payout_rate)
      `)
      .order('planned_date', { ascending: false })

    if (filter === 'unpaid') query = query.eq('is_paid_to_cleaner', false)
    if (filter === 'paid') query = query.eq('is_paid_to_cleaner', true)

    const { data, error } = await query
    if (error) console.error(error)

    const ordersList = data || []
    setOrders(ordersList)

    const unpaid = ordersList.filter(o => !o.is_paid_to_cleaner)
    const total = unpaid.reduce((sum, order) => sum + calculateSalary(order), 0)
    setTotalToPay(total)

    setLoading(false)
  }

  function calculateSalary(order: PaymentOrder): number {
    if (order.salary_value !== null && order.salary_value !== undefined) {
      return order.salary_value
    }

    const rate = order.profiles?.payout_rate
    if (!rate || rate === 'manual') {
      return 0
    }

    const percent = parseInt(rate)
    return Math.round(order.price * (percent / 100))
  }

  const markAsPaid = async (order: PaymentOrder) => {
    const salary = manualSalary[order.id] !== undefined 
      ? manualSalary[order.id] 
      : calculateSalary(order)

    const { error } = await supabase
      .from('orders')
      .update({
        is_paid_to_cleaner: true,
        paid_at: new Date().toISOString(),
        salary_value: salary
      })
      .eq('id', order.id)

    if (!error) {
      fetchPayments()
    } else {
      alert(errorsT('serverError'))
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStats = () => {
    const totalOrders = orders.length
    const paidOrders = orders.filter(o => o.is_paid_to_cleaner).length
    const unpaidOrders = totalOrders - paidOrders
    const totalPaidAmount = orders
      .filter(o => o.is_paid_to_cleaner)
      .reduce((sum, o) => sum + (o.salary_value || 0), 0)
    
    return { totalOrders, paidOrders, unpaidOrders, totalPaidAmount }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Wallet size={20} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {paymentsT('title')}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 ml-13">
                {paymentsT('manage')}
              </p>
            </div>
            
            {/* Total to pay card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs uppercase tracking-wider">{paymentsT('toPay')}</p>
                  <p className="text-3xl font-bold text-white">{totalToPay.toFixed(0)} zł</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{paymentsT('allOrders')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <CreditCard size={18} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{paymentsT('unpaid')}</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.unpaidOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{paymentsT('paid')}</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.paidOrders}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <Check size={18} className="text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{paymentsT('paidAmount')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalPaidAmount} zł</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                <DollarSign size={18} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'unpaid', 'paid'] as const).map((f) => {
              const isActive = filter === f
              const getLabel = () => {
                if (f === 'all') return paymentsT('allOrders')
                if (f === 'unpaid') return paymentsT('unpaid')
                return paymentsT('paid')
              }
              const getCount = () => {
                if (f === 'all') return stats.totalOrders
                if (f === 'unpaid') return stats.unpaidOrders
                return stats.paidOrders
              }
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`group relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {getLabel()}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {getCount()}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Wallet size={40} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xl font-medium text-gray-900 dark:text-white">{paymentsT('noOrders')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {filter === 'unpaid' && paymentsT('noUnpaidOrders')}
                  {filter === 'paid' && paymentsT('noPaidOrders')}
                  {filter === 'all' && paymentsT('noOrders')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
                    <th className="text-left p-5 font-semibold text-gray-700 dark:text-gray-300">{paymentsT('orderClient')}</th>
                    <th className="text-left p-5 font-semibold text-gray-700 dark:text-gray-300">{paymentsT('cleaner')}</th>
                    <th className="text-left p-5 font-semibold text-gray-700 dark:text-gray-300">{paymentsT('orderPrice')}</th>
                    <th className="text-left p-5 font-semibold text-gray-700 dark:text-gray-300">{paymentsT('salaryType')}</th>
                    <th className="text-right p-5 font-semibold text-gray-700 dark:text-gray-300">{paymentsT('salaryAmount')}</th>
                    <th className="text-center p-5 font-semibold text-gray-700 dark:text-gray-300">{paymentsT('status')}</th>
                    <th className="w-40 p-5"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order, idx) => {
                    const calculated = calculateSalary(order)
                    const isPaid = order.is_paid_to_cleaner
                    const rate = order.profiles?.payout_rate

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms` }}>
                        <td className="p-5">
                          <div className="font-semibold text-gray-900 dark:text-white">{order.client_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {formatDate(order.planned_date)}
                          </div>
                        </td>

                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {order.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <span className="text-gray-900 dark:text-white">
                              {order.profiles?.full_name || cleanersT('notAssigned')}
                            </span>
                          </div>
                        </td>

                        <td className="p-5">
                          <span className="font-semibold text-gray-900 dark:text-white">{order.price} zł</span>
                        </td>

                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full ${
                            rate === 'manual' 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          }`}>
                            {rate === 'manual' ? cleanersT('manual') : `${rate}%`}
                          </span>
                        </td>

                        <td className="p-5 text-right">
                          {!isPaid ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm text-gray-500">zł</span>
                              <input
                                type="number"
                                className="w-28 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                value={
                                  manualSalary[order.id] !== undefined
                                    ? manualSalary[order.id]
                                    : calculated
                                }
                                onChange={(e) =>
                                  setManualSalary({
                                    ...manualSalary,
                                    [order.id]: Number(e.target.value)
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {order.salary_value} zł
                            </span>
                          )}
                        </td>

                        <td className="p-5 text-center">
                          {isPaid ? (
                            <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full text-sm">
                              <Check size={14} />
                              <span>{paymentsT('paid')}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full text-sm">
                              <AlertCircle size={14} />
                              <span>{paymentsT('unpaid')}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-5 text-right">
                          {!isPaid && (
                            <button
                              onClick={() => markAsPaid(order)}
                              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                              {paymentsT('payNow')}
                            </button>
                          )}

                          {isPaid && order.paid_at && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                              <div>{paymentsT('paidAt')}: {order.salary_value} zł</div>
                              <div>{new Date(order.paid_at).toLocaleDateString('ru-RU')}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2026 CRM Cleaning Company • {paymentsT('title')}</p>
        </div>
      </div>
    </div>
  )
}