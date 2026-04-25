// src/app/dashboard/cleaner/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Calendar, MapPin, Phone, ArrowRight, Plus, Filter, Clock, User, DollarSign, AlertCircle } from 'lucide-react'
import { UnreadBadge } from '@/components/UnreadBadge'

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

export default function CleanerOrders() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const cleanersT = useTranslations('cleaners')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingRole, setCheckingRole] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  const statusLabels: Record<Order['status'], string> = {
    new: ordersT('status.new'),
    accepted: ordersT('status.accepted'),
    in_progress: ordersT('status.in_progress'),
    done: ordersT('status.done'),
    cancelled: ordersT('status.cancelled'),
  }

  const statusColors: Record<Order['status'], string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  }

  const statusIcons: Record<Order['status'], string> = {
    new: '🆕',
    accepted: '✅',
    in_progress: '🔄',
    done: '✔️',
    cancelled: '❌',
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        router.replace('/dashboard/admin')
        return
      }
      
      setUserId(user.id)
      setCheckingRole(false)
      await fetchOrders()
    }

    init()
  }, [])

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
        setError(ordersT('loadError'))
        setOrders([])
      } else {
        setOrders(data || [])
      }
    } catch (err) {
      console.error('Неожиданная ошибка:', err)
      setError(ordersT('loadError'))
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Calendar size={20} className="text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                {ordersT('title')}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-13">
              {t('manageTasks')}
            </p>
          </div>
          
          <Link
            href="/dashboard/cleaner/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus size={18} />
            <span>{ordersT('new')}</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{t('total')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Clock size={14} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{ordersT('status.new')}</p>
              <p className="text-xl font-bold text-blue-600">{getStatusCount('new')}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <span className="text-lg">🆕</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{ordersT('status.in_progress')}</p>
              <p className="text-xl font-bold text-amber-600">{getStatusCount('in_progress')}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <span className="text-lg">🔄</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{ordersT('status.done')}</p>
              <p className="text-xl font-bold text-green-600">{getStatusCount('done')}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
              <span className="text-lg">✔️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{ordersT('filterByStatus')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'accepted', 'in_progress', 'done'] as const).map((status) => {
            const count = getStatusCount(status)
            const isActive = filter === status
            const label = status === 'all' ? ordersT('allOrders') : statusLabels[status]
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`group relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {status !== 'all' && <span>{statusIcons[status]}</span>}
                  {label}
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{error}</p>
              <button
                onClick={fetchOrders}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Calendar size={40} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xl font-medium text-gray-900 dark:text-white">{ordersT('noOrders')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filter !== 'all' ? `${ordersT('noOrders')} ${ordersT('status')} "${statusLabels[filter]}"` : ordersT('noOrders')}
              </p>
              {filter === 'all' && (
                <Link
                  href="/dashboard/cleaner/new"
                  className="inline-flex items-center gap-2 mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <Plus size={16} />
                  {ordersT('new')}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {orders.map((order, idx) => (
            <Link
              key={order.id}
              href={`/dashboard/cleaner/orders/${order.id}`}
              className="group animate-in slide-in-from-bottom-4 duration-500 relative"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
                <UnreadBadge orderId={order.id} userId={userId || undefined} />
                
                {/* Header */}
                <div className="p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${statusColors[order.status]}`}>
                        <span>{statusIcons[order.status]}</span>
                        <span>{statusLabels[order.status]}</span>
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {order.price} zł
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
                    {order.client_name}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 line-clamp-2">
                        {order.address}
                      </span>
                    </div>

                    {order.planned_date && (
                      <div className="flex items-center gap-2.5">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                          {order.planned_time && ` • ${order.planned_time.slice(0, 5)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{order.client_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                    {ordersT('details')}
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}