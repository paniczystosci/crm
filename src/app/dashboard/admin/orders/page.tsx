// src/app/(dashboard)/admin/orders/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Calendar, Clock, User, DollarSign, Package, Filter, ChevronRight, Timer } from 'lucide-react'
import { UnreadBadge } from '@/components/UnreadBadge'
import { getUnreadCount } from '@/lib/supabase/markMessagesAsRead'

type Order = {
  id: string
  client_name: string
  address: string
  price: number
  status: string
  planned_date?: string
  planned_time?: string
  duration?: number
  cleaner_id?: string
  profiles?: { full_name: string } | null
}

export default function AdminOrders() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const cleanersT = useTranslations('cleaners')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  const statusLabels: Record<string, string> = {
    new: ordersT('status.new'),
    accepted: ordersT('status.accepted'),
    in_progress: ordersT('status.in_progress'),
    done: ordersT('status.done'),
    cancelled: ordersT('status.cancelled'),
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  }

  const statusIcons: Record<string, string> = {
    new: '',
    accepted: '',
    in_progress: '',
    done: '',
    cancelled: '',
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
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

  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  // Функция форматирования длительности
  const formatDuration = (minutes?: number) => {
    if (!minutes) return ''
    if (minutes >= 60) {
      const hours = minutes / 60
      return `${hours} ${t('hours')}`
    }
    return `${minutes} ${t('minutes')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Package size={20} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {ordersT('title')}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 ml-13">
                {ordersT('manage')}
              </p>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</div>
                <div className="text-xs text-gray-500">{t('total')}</div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{getStatusCount('new') + getStatusCount('accepted')}</div>
                <div className="text-xs text-gray-500">{ordersT('active')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{ordersT('filterByStatus')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'accepted', 'in_progress', 'done', 'cancelled'] as const).map((status) => {
              const count = getStatusCount(status)
              const isActive = filterStatus === status
              const label = status === 'all' ? ordersT('allOrders') : statusLabels[status]
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`group relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {status !== 'all' && <span>{statusIcons[status]}</span>}
                    {label}
                    {count > 0 && (
                      <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
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

        {/* Orders List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Package size={40} className="text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{ordersT('noOrders')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {filterStatus !== 'all' ? `${ordersT('noOrders')} со статусом "${statusLabels[filterStatus]}"` : ordersT('noOrders')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <Link
                key={order.id}
                href={`/dashboard/admin/orders/${order.id}`}
                className="group block animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 relative">
                  <UnreadBadge orderId={order.id} userId={userId || undefined} />
                  
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    
                    {/* Основная информация */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium ${statusColors[order.status]}`}>
                          <span>{statusIcons[order.status]}</span>
                          <span>{statusLabels[order.status]}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1">
                        {order.client_name}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0">
                          <User size={16} className="flex-shrink-0 text-gray-400" />
                          <span className="truncate">{order.address}</span>
                        </div>
                        
                        {order.planned_date && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} className="text-gray-400" />
                            <span>{new Date(order.planned_date).toLocaleDateString('ru-RU')}</span>
                            {order.planned_time && (
                              <>
                                <Clock size={14} className="text-gray-400 ml-1" />
                                <span>{order.planned_time.slice(0, 5)}</span>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Длительность уборки */}
                        {order.duration && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Timer size={16} className="text-gray-400" />
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatDuration(order.duration)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign size={16} className="text-gray-400" />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
                        </div>
                      </div>
                    </div>

                    {/* Правая часть - клинер и действие */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 lg:border-l lg:border-gray-200 dark:lg:border-gray-700 lg:pl-6">
                      {order.profiles?.full_name && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ordersT('cleaner')}</div>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {order.profiles.full_name[0]?.toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {order.profiles.full_name}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-3 transition-all">
                        <span className="text-sm">{ordersT('details')}</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2026 CRM Cleaning Company • {ordersT('title')}</p>
        </div>
      </div>
    </div>
  )
}