'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import OrderChat from '@/components/OrderChat'
import Link from 'next/link'
import { 
  Calendar, 
  MapPin, 
  Phone, 
  DollarSign, 
  ArrowLeft, 
  Clock, 
  User,
  CheckCircle,
  Clock as ClockIcon,
  Sparkles,
  AlertCircle,
  Wallet,
  Landmark,
  Coins,
  X,
  MessageCircle,
  BellRing,
  Zap,
  Award,
  BellDot,
  Eye,
  Package,
  ChevronRight
} from 'lucide-react'

type Order = {
  cleaner_id: any
  id: string
  client_name: string
  client_phone: string
  address: string
  google_maps_link?: string | null
  comment?: string | null
  price: number
  status: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled'
  planned_date?: string | null
  planned_time?: string | null
  cash_received?: number | null
  bank_received?: number | null
  change_given?: number | null
  is_incassed?: boolean
  created_at?: string
}

type UnreadInfo = {
  count: number
  lastMessageAt: string
}

export default function CleanerOrderDetail() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const paymentsT = useTranslations('payments')
  const chatT = useTranslations('chat')
  const errorsT = useTranslations('errors')
  
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [unreadInfo, setUnreadInfo] = useState<UnreadInfo | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentType, setPaymentType] = useState<'cash' | 'bank'>('cash')
  const [clientGiven, setClientGiven] = useState(0)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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

  const statusMessages: Record<string, { title: string; subtitle: string; gradient: string }> = {
    new: {
      title: '✨ Новый заказ',
      subtitle: 'Примите заказ, чтобы начать работу',
      gradient: 'from-blue-500 to-indigo-500'
    },
    accepted: {
      title: '✅ Заказ принят',
      subtitle: 'Нажмите "Старт", когда приступите к уборке',
      gradient: 'from-emerald-500 to-teal-500'
    },
    in_progress: {
      title: '🔄 Работа в процессе',
      subtitle: 'Завершите уборку и примите оплату',
      gradient: 'from-amber-500 to-orange-500'
    },
    done: {
      title: '🎉 Заказ выполнен',
      subtitle: 'Отлично сработано! Заказ завершен',
      gradient: 'from-green-500 to-emerald-500'
    }
  }

  // Получаем ID пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  // Загрузка заказа
  useEffect(() => {
    fetchOrder()
  }, [id])

  // Загрузка непрочитанных сообщений для этого заказа
  useEffect(() => {
    if (userId && id) {
      fetchUnreadMessages()
      
      // Подписка на новые сообщения
      const channel = supabase
        .channel(`unread-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${id}`,
          },
          () => {
            fetchUnreadMessages()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, id])

  async function fetchOrder() {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError(errorsT('orderNotFound'))
      } else {
        if (data.status !== 'new' && data.cleaner_id !== user.id) {
          setError(errorsT('accessDenied'))
        } else {
          setOrder(data)
          setClientGiven(data.price)
        }
      }
    } catch (err) {
      setError(errorsT('loadError'))
    } finally {
      setLoading(false)
    }
  }

  async function fetchUnreadMessages() {
    if (!userId || !id) return

    try {
      // Получаем последнее прочтение пользователя
      const { data: readData } = await supabase
        .from('order_chat_reads')
        .select('last_read_at')
        .eq('order_id', id)
        .eq('user_id', userId)
        .single()

      const lastReadAt = readData ? new Date(readData.last_read_at) : null

      // Получаем все сообщения в этом заказе
      const { data: messages } = await supabase
        .from('order_messages')
        .select('created_at')
        .eq('order_id', id)
        .order('created_at', { ascending: false })

      if (!messages || messages.length === 0) {
        setUnreadInfo(null)
        return
      }

      // Считаем непрочитанные
      let unreadCount = 0
      let lastMessageAt = messages[0].created_at

      for (const msg of messages) {
        const msgDate = new Date(msg.created_at)
        if (!lastReadAt || msgDate > lastReadAt) {
          unreadCount++
        } else {
          break
        }
      }

      if (unreadCount > 0) {
        setUnreadInfo({
          count: unreadCount,
          lastMessageAt: lastMessageAt
        })
      } else {
        setUnreadInfo(null)
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    setUpdating(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const updates: any = { status: newStatus }
    if (newStatus === 'accepted' && !order.cleaner_id) {
      updates.cleaner_id = user?.id
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      
    if (!error) fetchOrder()
    setUpdating(false)
  }

  const handleAcceptPayment = async () => {
    if (!order) return

    const cash = paymentType === 'cash' ? clientGiven : 0
    const bank = paymentType === 'bank' ? order.price : 0
    const change = paymentType === 'cash' ? Math.max(0, clientGiven - order.price) : 0

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'done',
        cash_received: cash,
        bank_received: bank,
        change_given: change,
        payment_accepted_at: new Date().toISOString(),
        is_incassed: false,
      })
      .eq('id', id)

    if (error) {
      alert(`${errorsT('serverError')}: ${error.message}`)
    } else {
      alert(paymentsT('paidMessage'))
      setShowPaymentForm(false)
      fetchOrder()
    }
  }

  const getNextAction = () => {
    switch (order?.status) {
      case 'new':
        return { 
          label: ordersT('accept'), 
          status: 'accepted', 
          color: 'blue',
          bgGradient: 'from-blue-600 to-blue-500',
          hoverGradient: 'from-blue-700 to-blue-600',
          icon: CheckCircle,
          description: 'Принять заказ и приступить'
        }
      case 'accepted':
        return { 
          label: ordersT('start'), 
          status: 'in_progress', 
          color: 'yellow',
          bgGradient: 'from-yellow-500 to-amber-500',
          hoverGradient: 'from-yellow-600 to-amber-600',
          icon: ClockIcon,
          description: 'Начать выполнение работ'
        }
      case 'in_progress':
        return { 
          label: ordersT('completeAndPay'), 
          status: 'done', 
          color: 'green',
          bgGradient: 'from-green-600 to-emerald-600',
          hoverGradient: 'from-green-700 to-emerald-700',
          icon: Sparkles,
          description: 'Завершить заказ и принять оплату',
          action: () => setShowPaymentForm(true) 
        }
      default:
        return null
    }
  }

  const nextAction = getNextAction()
  const statusMessage = order ? statusMessages[order.status as keyof typeof statusMessages] : null

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full animate-ping border-2 border-emerald-400 opacity-20"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-red-500 mb-6 text-lg">{error || errorsT('notFound')}</p>
          <Link
            href="/dashboard/cleaner"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
          >
            {ordersT('backToOrders')}
          </Link>
        </div>
      </div>
    )
  }

  const change = Math.max(0, clientGiven - order.price)
  const hasUnread = !!unreadInfo
  const isHovered = hoveredCard === 'main'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-12">
        {/* Header with back button */}
        <div className="mb-8">
          <Link 
            href="/dashboard/cleaner"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>{ordersT('backToOrders')}</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Package size={20} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {ordersT('title')} {order.id.slice(0, 8).toUpperCase()}
                </h1>
                {/* Badge с уведомлениями в шапке - улучшенный */}
                {hasUnread && (
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60"></div>
                    <div className="relative flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-lg">
                      <BellDot size={12} className="text-white animate-bounce" />
                      <span className="text-xs font-bold text-white">
                        {unreadInfo.count} {unreadInfo.count === 1 ? 'новое' : 'новых'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 ml-13">
                {ordersT('client')}: <span className="font-medium text-gray-700 dark:text-gray-300">{order.client_name}</span>
              </p>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${statusColors[order.status]} shadow-sm`}>
              <span>{statusIcons[order.status]}</span>
              <span>{statusLabels[order.status]}</span>
            </div>
          </div>
        </div>

        {/* Баннер с уведомлением о непрочитанных сообщениях - улучшенный как в админке */}
        {hasUnread && order.status !== 'done' && (
          <div className="mb-6 relative animate-in slide-in-from-top-4 duration-500">
            <div className="absolute -top-2 -left-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="bg-gradient-to-r from-red-500 to-amber-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                  <BellRing size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">📬 Новые сообщения в чате!</p>
                  <p className="text-sm text-white/90">
                    У вас {unreadInfo.count} {unreadInfo.count === 1 ? 'непрочитанное сообщение' : 'непрочитанных сообщений'}
                    {unreadInfo.lastMessageAt && ` (${getLastMessageTime(unreadInfo.lastMessageAt)})`}
                  </p>
                </div>
                <Eye size={24} className="text-white animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Status Message Banner */}
        {statusMessage && order.status !== 'done' && (
          <div className={`mb-6 bg-gradient-to-r ${statusMessage.gradient} rounded-xl p-4 text-white shadow-lg animate-in slide-in-from-top-4 duration-500`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold">{statusMessage.title}</p>
                <p className="text-sm text-white/90">{statusMessage.subtitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Info Card - полностью кликабельно как в админке */}
        <div 
          onClick={() => router.push(`/dashboard/cleaner/orders/${order.id}`)}
          onMouseEnter={() => setHoveredCard('main')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`
            relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border transition-all duration-300 cursor-pointer mb-8
            ${hasUnread 
              ? 'border-red-300 dark:border-red-700 shadow-red-100 dark:shadow-red-950/20 hover:shadow-2xl' 
              : 'border-gray-200 dark:border-gray-700 hover:shadow-2xl'
            }
            hover:-translate-y-0.5
          `}
        >
          {/* Уведомление badge как в админке */}
          {hasUnread && (
            <div className="absolute -top-3 -right-3 z-10">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60"></div>
                <div className="relative flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-lg">
                  <BellDot size={14} className="text-white animate-bounce" />
                  <span className="text-xs font-bold text-white">
                    {unreadInfo.count} {unreadInfo.count === 1 ? 'новое сообщение' : 'новых сообщений'}
                  </span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Индикатор нового сообщения */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-medium ${statusColors[order.status]}`}>
                <span>{statusIcons[order.status]}</span>
                <span>{statusLabels[order.status]}</span>
              </span>
              <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
              {hasUnread && (
                <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400 animate-pulse font-medium">
                  <Sparkles size={12} />
                  <span>Новое сообщение</span>
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Client Info */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <User size={20} className="text-emerald-500" />
                  {ordersT('client')}
                  {hasUnread && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse flex items-center gap-1">
                      <BellRing size={10} />
                      {unreadInfo.count}
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 group">
                    <Phone size={18} className="text-gray-400 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{ordersT('phone')}</p>
                      <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.client_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 group">
                    <MapPin size={18} className="text-gray-400 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{ordersT('address')}</p>
                      <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-500" />
                  {ordersT('details')}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500">{ordersT('price')}</span>
                    <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
                  </div>
                  {order.planned_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">{ordersT('plannedDate')}</span>
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                        {order.planned_time && (
                          <>
                            <Clock size={16} className="text-gray-400 ml-1" />
                            {order.planned_time.slice(0, 5)}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Информация о последнем сообщении как в админке */}
            {hasUnread && unreadInfo.lastMessageAt && (
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/30">
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <BellDot size={10} />
                  Последнее сообщение: {getLastMessageTime(unreadInfo.lastMessageAt)}
                </p>
              </div>
            )}

            {/* Комментарий если есть */}
            {order.comment && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageCircle size={12} />
                  {ordersT('comment')}
                </p>
                <p className="italic text-gray-700 dark:text-gray-300">{order.comment}</p>
              </div>
            )}

            {/* Кнопка перехода внизу карточки как в админке */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <div className={`
                flex items-center gap-2 font-medium transition-all duration-300
                ${hasUnread 
                  ? 'text-red-600 dark:text-red-400 gap-3' 
                  : 'text-emerald-600 dark:text-emerald-400'
                }
              `}>
                <span className="text-sm">
                  {hasUnread ? 'Перейти к сообщению' : ordersT('details')}
                </span>
                {hasUnread ? (
                  <Eye size={18} className="animate-pulse" />
                ) : (
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </div>

            {/* Индикатор прогресса кликабельности */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
          </div>
        </div>

        {/* Status Action Button */}
        {nextAction && !showPaymentForm && (
          <div className="mb-8 animate-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={nextAction.action || (() => updateStatus(nextAction.status))}
              disabled={updating}
              onMouseEnter={() => setHoveredButton('action')}
              onMouseLeave={() => setHoveredButton(null)}
              className={`w-full py-4 bg-gradient-to-r ${nextAction.bgGradient} hover:${nextAction.hoverGradient} disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-lg group`}
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>{t('loading')}</span>
                </>
              ) : (
                <>
                  <nextAction.icon size={20} className={`transition-transform duration-300 ${hoveredButton === 'action' ? 'scale-110' : ''}`} />
                  <span>{nextAction.label}</span>
                  <Sparkles size={16} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}
            </button>
            {nextAction.description && (
              <p className="text-center text-xs text-gray-400 mt-2">{nextAction.description}</p>
            )}
          </div>
        )}

        {/* Completion Badge for Done Orders */}
        {order.status === 'done' && (
          <div className="mb-8 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-5 text-center border border-green-200 dark:border-green-800/30 animate-in zoom-in duration-500">
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-green-700 dark:text-green-400 text-lg">Заказ успешно выполнен!</p>
                <p className="text-sm text-green-600 dark:text-green-500">Спасибо за качественную работу</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Section с улучшенным индикатором уведомлений */}
        <div className="mt-8 animate-in slide-in-from-bottom-6 duration-700">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle size={18} className="text-emerald-500" />
                {chatT('title')}
              </h3>
            </div>
            {hasUnread && (
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-60"></div>
                <div className="relative flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-lg">
                  <BellRing size={12} className="text-white animate-bounce" />
                  <span className="text-xs font-bold text-white">{unreadInfo.count} новых</span>
                </div>
              </div>
            )}
          </div>
          <OrderChat orderId={id} isAdmin={false} />
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2026 CRM Cleaning Company • {ordersT('title')} #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet size={22} className="text-emerald-500" />
                  {paymentsT('title')}
                </h2>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{ordersT('price')}</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{order.price} zł</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('paymentMethod')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentType('cash')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
                        paymentType === 'cash'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-[1.02]'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Coins size={18} />
                      {t('cash')}
                    </button>
                    <button
                      onClick={() => setPaymentType('bank')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
                        paymentType === 'bank'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-[1.02]'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Landmark size={18} />
                      {t('bank')}
                    </button>
                  </div>
                </div>

                {paymentType === 'cash' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('clientGiven')}
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <DollarSign size={18} />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={clientGiven}
                          onChange={(e) => setClientGiven(parseFloat(e.target.value) || 0)}
                          className="w-full pl-11 pr-4 py-3 text-xl font-semibold bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-500 transition-all"
                          autoFocus
                        />
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-xl transition-all duration-200 ${change > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">{t('change')}:</span>
                        <span className={`font-bold text-xl ${change > 0 ? 'text-amber-600' : 'text-green-600'} ${change > 0 ? 'animate-pulse' : ''}`}>
                          {change.toFixed(2)} zł
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentType === 'bank' && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5 text-center animate-in slide-in-from-top-2 duration-200">
                    <Landmark size={32} className="text-blue-500 mx-auto mb-2" />
                    <p className="text-blue-700 dark:text-blue-300 font-medium">
                      {t('totalAmount')} {order.price} zł
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      {t('bankTransferInfo')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAcceptPayment}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 group"
                  >
                    <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                    {t('acceptPayment')}
                  </button>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}