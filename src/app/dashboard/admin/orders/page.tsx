// src/app/(dashboard)/admin/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Calendar, Clock, User, DollarSign } from 'lucide-react'

type Order = {
  id: string
  client_name: string
  address: string
  price: number
  status: string
  planned_date?: string
  planned_time?: string
  cleaner_id?: string
  profiles?: { full_name: string } | null
}

const statusLabels: Record<string, string> = {
  new: 'Новый',
  accepted: 'Принят',
  in_progress: 'В работе',
  done: 'Завершён',
  cancelled: 'Отменён',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  async function fetchOrders() {
    setLoading(true)

    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!cleaner_id (full_name)
      `)
      .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query
    if (error) console.error(error)
    else setOrders(data || [])

    setLoading(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Все заказы</h1>
        <div className="flex gap-3">
          {(['all', 'new', 'accepted', 'in_progress', 'done', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {status === 'all' ? 'Все' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Загрузка заказов...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center text-zinc-400">Заказов не найдено</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/admin/orders/${order.id}`}
              className="card p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-all group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </div>
                  <div className="font-semibold text-lg">{order.client_name}</div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-zinc-400" />
                    <span className="line-clamp-1">{order.address}</span>
                  </div>
                  {order.planned_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-zinc-400" />
                      <span>{new Date(order.planned_date).toLocaleDateString('ru-RU')}</span>
                      {order.planned_time && <span>в {order.planned_time.slice(0,5)}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-zinc-400" />
                    <span className="font-medium">{order.price} zł</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 md:ml-auto">
                {order.profiles?.full_name && (
                  <div className="text-sm text-right">
                    <div className="text-zinc-500">Клинер</div>
                    <div>{order.profiles.full_name}</div>
                  </div>
                )}
                <div className="text-rose-600 group-hover:translate-x-1 transition-transform">
                  → Подробнее
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}