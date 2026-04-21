// src/app/dashboard/cleaner/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Phone, ArrowRight } from 'lucide-react'

type Order = {
  id: string
  client_name: string
  client_phone: string
  address: string
  price: number
  status: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
  planned_date: string | null
  planned_time: string | null
  created_at: string
}

const statusLabels: Record<Order['status'], string> = {
  new: 'Новый',
  accepted: 'Принят',
  in_progress: 'В работе',
  done: 'Завершён',
  cancelled: 'Отменён',
}

const statusColors: Record<Order['status'], string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export default function CleanerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [filter])

  async function fetchOrders() {
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Пользователь не авторизован:', authError)
        router.push('/auth/login')
        return
      }

      let query = supabase
        .from('orders')
        .select('*')
        .eq('cleaner_id', user.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error in fetchOrders:', error)
        setError('Ошибка при загрузке заказов')
        setOrders([])
      } else {
        setOrders(data || [])
      }
    } catch (err) {
      console.error('Неожиданная ошибка:', err)
      setError('Произошла ошибка при загрузке данных')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Мои заказы</h1>
        <Link
          href="/dashboard/cleaner/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition-colors"
        >
          + Новый заказ
        </Link>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'new', 'accepted', 'in_progress', 'done'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {s === 'all' ? 'Все' : statusLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : error ? (
        <div className="card p-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-yellow-600 text-white rounded-2xl hover:bg-yellow-700"
          >
            Попробовать снова
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-2xl text-zinc-400">Заказов пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/cleaner/orders/${order.id}`}
              className="card p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </div>
                <div className="text-lg font-semibold text-blue-600">{order.price} zł</div>
              </div>

              <h3 className="font-semibold text-lg mb-3 line-clamp-1">{order.client_name}</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 text-zinc-400" size={18} />
                  <span className="line-clamp-2">{order.address}</span>
                </div>

                {order.planned_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="text-zinc-400" size={18} />
                    <span>
                      {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                      {order.planned_time && ` • ${order.planned_time.slice(0, 5)}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Phone className="text-zinc-400" size={18} />
                  <span>{order.client_phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                <span className="text-rose-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-sm font-medium">
                  Открыть <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}