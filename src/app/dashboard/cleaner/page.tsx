'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Calendar, MapPin, Phone, ArrowRight, Plus, Filter, Clock, User, DollarSign, AlertCircle, CheckCircle, BellDot, Eye, Sparkles } from 'lucide-react'

type Order = {
  duration: string | null
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

type UnreadInfo = {
  orderId: string
  count: number
  lastMessageAt: string
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
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [unreadMap, setUnreadMap] = useState<Map<string, UnreadInfo>>(new Map())
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null)

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
  }, [filter])

  // Загрузка непрочитанных сообщений
  useEffect(() => {
    if (userId && orders.length > 0) {
      fetchAllUnreadMessages()
      
      // Подписка на новые сообщения
      const channel = supabase
        .channel('cleaner-new-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
          },
          () => {
            fetchAllUnreadMessages()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, orders])

  async function fetchOrders() {
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        setError(ordersT('loadError'))
        setOrders([])
      } else {
        let filteredOrders = (data || []).filter(order => {
          const isNew = order.status === 'new'
          const isMine = order.cleaner_id === user.id
          return isNew || isMine
        })
        
        if (filter !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === filter)
        }
        
        setOrders(filteredOrders)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError(ordersT('loadError'))
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Функция для загрузки непрочитанных сообщений
  async function fetchAllUnreadMessages() {
    if (!userId || orders.length === 0) return

    try {
      const orderIds = orders.map(o => o.id)

      // Получаем последние прочтения пользователя
      const { data: reads } = await supabase
        .from('order_chat_reads')
        .select('order_id, last_read_at')
        .eq('user_id', userId)

      const readMap = new Map(
        reads?.map(r => [r.order_id, new Date(r.last_read_at)]) || []
      )

      // Получаем последние сообщения по каждому заказу
      const { data: messages } = await supabase
        .from('order_messages')
        .select('order_id, created_at')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false })

      // Считаем непрочитанные
      const unread = new Map<string, UnreadInfo>()
      
      messages?.forEach(msg => {
        const lastRead = readMap.get(msg.order_id)
        const msgDate = new Date(msg.created_at)
        
        if (!lastRead || msgDate > lastRead) {
          const existing = unread.get(msg.order_id)
          if (!existing) {
            unread.set(msg.order_id, {
              orderId: msg.order_id,
              count: 1,
              lastMessageAt: msg.created_at
            })
          } else {
            unread.set(msg.order_id, {
              ...existing,
              count: existing.count + 1
            })
          }
        }
      })

      setUnreadMap(unread)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  // Функция для форматирования времени последнего сообщения
  const getLastMessageTime = (lastMessageAt?: string) => {
    if (!lastMessageAt) return ''
    const date = new Date(lastMessageAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    return `${diffDays} д назад`
  }

  const acceptOrder = async (orderId: string) => {
    setAcceptingId(orderId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          cleaner_id: user.id,
          status: 'accepted' 
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error accepting order:', error)
        alert(ordersT('loadError'))
      } else {
        await fetchOrders()
        router.push(`/dashboard/cleaner/orders/${orderId}`)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(ordersT('loadError'))
    } finally {
      setAcceptingId(null)
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
                {filter !== 'all' ? `${ordersT('noOrders')} со статусом "${statusLabels[filter as keyof typeof statusLabels]}"` : ordersT('noOrders')}
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
          {orders.map((order, idx) => {
            const unreadInfo = unreadMap.get(order.id)
            const hasUnread = !!unreadInfo
            
            return (
              <Link
                key={order.id}
                href={`/dashboard/cleaner/orders/${order.id}`}
                className="group animate-in slide-in-from-bottom-4 duration-500 block"
                style={{ animationDelay: `${idx * 50}ms` }}
                onMouseEnter={() => setHoveredOrder(order.id)}
                onMouseLeave={() => setHoveredOrder(null)}
              >
                <div className={`
                  relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border transition-all duration-300 overflow-visible
                  ${hasUnread 
                    ? 'border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-amber-950/20' 
                    : 'border-gray-200 dark:border-gray-700'
                  }
                  hover:shadow-xl hover:-translate-y-0.5
                `}>
                  {/* Бейдж с количеством новых сообщений */}
                  {hasUnread && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60"></div>
                        <div className="relative flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-lg">
                          <span className="text-[10px] font-bold text-white">
                            {unreadInfo.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Индикатор "Новое сообщение" */}
                  {hasUnread && (
                    <div className="absolute top-2 left-2 z-10">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/50 rounded-full">
                        <Sparkles size={10} className="text-red-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                          Новое сообщение
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[order.status]}`}>
                          <span>{statusIcons[order.status]}</span>
                          <span>{statusLabels[order.status]}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {order.price} zł
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className={`
                      font-semibold text-base line-clamp-1 transition-colors
                      ${hasUnread 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      }
                    `}>
                      {order.client_name}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 line-clamp-2 text-xs">
                          {order.address}
                        </span>
                      </div>

                      {order.planned_date && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                            {order.planned_time && ` • ${order.planned_time.slice(0, 5)}`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{order.client_phone}</span>
                      </div>
                    </div>

                    {/* Информация о последнем сообщении */}
                    {hasUnread && unreadInfo.lastMessageAt && (
                      <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/30">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <BellDot size={8} />
                          <span className="truncate">
                            Последнее: {getLastMessageTime(unreadInfo.lastMessageAt)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center gap-3">
                    {order.status === 'new' ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          acceptOrder(order.id)
                        }}
                        disabled={acceptingId === order.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-medium transition-all duration-200"
                      >
                        {acceptingId === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            <span>{t('loading')}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} />
                            <span>{ordersT('accept')}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1"></div>
                    )}
                    
                    <div className={`
                      inline-flex items-center gap-1 text-xs font-medium transition-all duration-300
                      ${hasUnread 
                        ? 'text-red-600 dark:text-red-400 gap-1.5' 
                        : 'text-emerald-600 dark:text-emerald-400 group-hover:gap-1.5'
                      }
                    `}>
                      <span>{hasUnread ? 'К чату' : ordersT('details')}</span>
                      {hasUnread ? (
                        <Eye size={12} className="animate-pulse" />
                      ) : (
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </div>

                  {/* Индикатор прогресса */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}