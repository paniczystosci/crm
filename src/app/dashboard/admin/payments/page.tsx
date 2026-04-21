// src/app/dashboard/admin/payments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Check, X, Calendar, User } from 'lucide-react'

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
    payout_rate: string   // ← НОВОЕ
  } | null
}

export default function AdminPayments() {
  const [orders, setOrders] = useState<PaymentOrder[]>([])
  const [manualSalary, setManualSalary] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid') // ← по умолчанию unpaid
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

  // ← УЛУЧШЕННЫЙ расчёт (работает с настройкой из profiles)
  function calculateSalary(order: PaymentOrder): number {
    // Если уже есть сохранённая сумма — используем её
    if (order.salary_value !== null && order.salary_value !== undefined) {
      return order.salary_value
    }

    // Новая логика — берём ставку клинера из профиля
    const rate = order.profiles?.payout_rate
    if (!rate || rate === 'manual') {
      return 0 // будет редактироваться вручную
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
      alert('Ошибка при отметке выплаты')
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

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold">Выплаты клинерам</h1>
          <p className="text-zinc-500 mt-1">Управление зарплатами за выполненные заказы</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">К выплате сейчас</p>
          <p className="text-4xl font-bold text-emerald-600">{totalToPay.toFixed(0)} zł</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex gap-3 mb-6">
        {(['all', 'unpaid', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {f === 'all' && 'Все заказы'}
            {f === 'unpaid' && 'Не выплачено'}
            {f === 'paid' && 'Выплачено'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-2xl text-zinc-400">Нет заказов по выбранному фильтру</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                  <th className="text-left p-6 font-medium">Клиент / Дата</th>
                  <th className="text-left p-6 font-medium">Клинер</th>
                  <th className="text-left p-6 font-medium">Цена заказа</th>
                  <th className="text-left p-6 font-medium">Тип зарплаты</th>
                  <th className="text-right p-6 font-medium">Зарплата</th>
                  <th className="text-center p-6 font-medium">Статус</th>
                  <th className="w-40 p-6"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {orders.map((order) => {
                  const calculated = calculateSalary(order)
                  const isPaid = order.is_paid_to_cleaner

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="p-6">
                        <div className="font-medium">{order.client_name}</div>
                        <div className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                          <Calendar size={14} />
                          {formatDate(order.planned_date)}
                        </div>
                      </td>

                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <User size={18} className="text-zinc-400" />
                          {order.profiles?.full_name || 'Не назначен'}
                        </div>
                      </td>

                      <td className="p-6 font-medium">{order.price} zł</td>

<td className="p-6">
  <span className="text-sm font-medium">
    {order.profiles?.payout_rate === 'manual'
      ? 'Ручная'
      : `${order.profiles?.payout_rate}%`}
  </span>
</td>

                      <td className="p-6 text-right font-semibold text-emerald-600">
                        {!isPaid ? (
                          <input
                            type="number"
                            className="w-24 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
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
                        ) : (
                          `${order.salary_value} zł`
                        )}
                      </td>

                      <td className="p-6 text-center">
                        {isPaid ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-600">
                            <Check size={18} /> Выплачено
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-amber-600">
                            <X size={18} /> Не выплачено
                          </div>
                        )}
                      </td>

                      <td className="p-6 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => markAsPaid(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition-colors"
                          >
                            Выплатить
                          </button>
                        )}

                        {isPaid && (
                          <div className="text-xs text-zinc-500 text-right">
                            Выплачено: {order.salary_value} zł<br />
                            {order.paid_at &&
                              new Date(order.paid_at).toLocaleDateString('ru-RU')}
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
    </div>
  )
}
