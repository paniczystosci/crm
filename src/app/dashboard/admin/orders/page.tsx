'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Calendar, Clock, User, DollarSign, Package, Filter, ChevronRight, Bell, BellDot, Eye, CheckCircle2, Sparkles } from 'lucide-react'
import { UnreadBadge } from '@/components/UnreadBadge'

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
  total_minutes?: number
  start_time?: string
  end_time?: string
  profiles?: { full_name: string } | null
}

export default function AdminOrders() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const notificationsT = useTranslations('notifications')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [unreadOrders, setUnreadOrders] = useState<Set<string>>(new Set())
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null)

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
    new: '🆕',
    accepted: '✅',
    in_progress: '🔄',
    done: '✔️',
    cancelled: '❌',
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  useEffect(() => {
    if (!userId) return

    // Подписка на непрочитанные сообщения
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_chat_reads',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadMessages()
        }
      )
      .subscribe()

    fetchUnreadMessages()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

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
    if (error) console.error('Fetch orders error:', error)
    else setOrders(data || [])

    setLoading(false)
  }

  async function fetchUnreadMessages() {
    if (!userId) return

    const { data: reads } = await supabase
      .from('order_chat_reads')
      .select('order_id, last_read_at')
      .eq('user_id', userId)

    const readMap = new Map(
      reads?.map(r => [r.order_id, new Date(r.last_read_at)]) || []
    )

    const { data: messages } = await supabase
      .from('order_messages')
      .select('order_id, created_at')
      .in('order_id', orders.map(o => o.id))
      .order('created_at', { ascending: false })

    const unread = new Set<string>()
    messages?.forEach(msg => {
      const lastRead = readMap.get(msg.order_id)
      if (!lastRead || new Date(msg.created_at) > lastRead) {
        unread.add(msg.order_id)
      }
    })

    setUnreadOrders(unread)
  }

  const getStatusCount = (status: string) => {
    if (status === 'all') return orders.length
    return orders.filter(o => o.status === status).length
  }

  const formatDuration = (minutes?: number) => {
    if (minutes == null) return ''
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m === 0 ? `${h} ${t('hours')}` : `${h}ч ${m}мин`
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
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
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
                <div className="text-2xl font-bold text-emerald-600">
                  {getStatusCount('new') + getStatusCount('accepted')}
                </div>
                <div className="text-xs text-gray-500">{ordersT('active')}</div>
              </div>
              {unreadOrders.size > 0 && (
                <div className="text-center">
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-3"></div>
                  <div className="flex items-center gap-1">
                    <BellDot size={18} className="text-amber-500" />
                    <div className="text-2xl font-bold text-amber-600">{unreadOrders.size}</div>
                  </div>
                  <div className="text-xs text-gray-500">{notificationsT('newMessage')}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
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
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
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
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Package size={40} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">{ordersT('noOrders')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const hasUnread = unreadOrders.has(order.id)
              const isHovered = hoveredOrder === order.id
              
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/admin/orders/${order.id}`}
                  className="group block animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onMouseEnter={() => setHoveredOrder(order.id)}
                  onMouseLeave={() => setHoveredOrder(null)}
                >
                  <div className={`
                    relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-300
                    ${hasUnread 
                      ? 'border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-amber-950/20' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                    hover:shadow-xl hover:-translate-y-0.5
                  `}>
                    {/* Уведомление badge */}
                    {hasUnread && (
                      <div className="absolute -top-2 -right-2 z-10 animate-bounce">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-60"></div>
                          <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg">
                            <BellDot size={14} className="text-white" />
                            <span className="text-xs font-semibold text-white">
                              {notificationsT('newMessage')}
                            </span>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium ${statusColors[order.status]}`}>
                              <span>{statusIcons[order.status]}</span>
                              <span>{statusLabels[order.status]}</span>
                            </span>
                            <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                            {hasUnread && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 animate-pulse">
                                <Sparkles size={12} />
                                <span>New activity</span>
                              </span>
                            )}
                          </div>

                          <h3 className={`
                            font-bold text-xl mb-2 line-clamp-1 transition-colors
                            ${hasUnread 
                              ? 'text-amber-700 dark:text-amber-400' 
                              : 'text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                            }
                          `}>
                            {order.client_name}
                            {hasUnread && <span className="ml-2 text-amber-500">✨</span>}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
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
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <DollarSign size={16} className="text-gray-400" />
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
                            </div>
                          </div>
                        </div>

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
                          <div className={`
                            flex items-center gap-2 font-medium transition-all duration-300
                            ${hasUnread 
                              ? 'text-amber-600 dark:text-amber-400 gap-3' 
                              : 'text-emerald-600 dark:text-emerald-400 group-hover:gap-3'
                            }
                          `}>
                            <span className="text-sm">
                              {hasUnread ? notificationsT('newMessage') : ordersT('details')}
                            </span>
                            {hasUnread ? (
                              <Eye size={18} className="animate-pulse" />
                            ) : (
                              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Индикатор прогресса кликабельности */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2026 CRM Cleaning Company • {ordersT('title')}</p>
        </div>
      </div>
    </div>
  )
}