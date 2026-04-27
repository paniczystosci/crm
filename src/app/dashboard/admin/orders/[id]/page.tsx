'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import OrderChat from '@/components/OrderChat'
import { Calendar, MapPin, Phone, DollarSign, ExternalLink, ArrowLeft, Clock, User, Edit3, Save, X, CheckCircle, Clock as ClockIcon, Sparkles, XCircle, ChevronDown, Play, Timer } from 'lucide-react'
import Link from 'next/link'

type Order = any

export default function AdminOrderDetail() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const cleanersT = useTranslations('cleaners')
  const errorsT = useTranslations('errors')
  const settingsT = useTranslations('settings')
  const notificationsT = useTranslations('notifications')
  
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [cleaners, setCleaners] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [editForm, setEditForm] = useState({
    cleaner_id: '',
    price: 0,
    planned_date: '',
    planned_time: '',
  })
  
  // Для таймера (обратный отсчёт)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
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

  // Список всех доступных статусов для выпадающего списка
  const allStatuses = [
    { value: 'new', label: ordersT('status.new'), icon: '🆕', color: 'blue' },
    { value: 'accepted', label: ordersT('status.accepted'), icon: '✅', color: 'emerald' },
    { value: 'in_progress', label: ordersT('status.in_progress'), icon: '🔄', color: 'amber' },
    { value: 'done', label: ordersT('status.done'), icon: '✔️', color: 'green' },
    { value: 'cancelled', label: ordersT('status.cancelled'), icon: '❌', color: 'red' },
  ]

  useEffect(() => {
    fetchOrder()
    fetchCleaners()
    
    // Очистка таймера при размонтировании
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [id])

  // Подписка на реальные изменения заказа в реальном времени
  useEffect(() => {
    const channel = supabase
      .channel(`order_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Обновляем локальный заказ
          setOrder((prev: any) => ({ ...prev, ...payload.new }))
          setSelectedStatus(payload.new.status)
          
          // Обновляем форму редактирования
          if (payload.new) {
            setEditForm(prev => ({
              ...prev,
              cleaner_id: payload.new.cleaner_id || '',
              price: payload.new.price,
              planned_date: payload.new.planned_date || '',
              planned_time: payload.new.planned_time || '',
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

  // Запуск таймера при изменении заказа
  useEffect(() => {
    if (order && order.status === 'in_progress' && order.start_time && !order.end_time) {
      startTimer()
    } else {
      // Если заказ не в процессе, очищаем таймер
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setRemainingSeconds(null)
    }
  }, [order?.status, order?.start_time, order?.end_time, order?.duration])

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status)
    }
  }, [order])

  async function fetchOrder() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!cleaner_id (full_name)
      `)
      .eq('id', id)
      .single()

    setOrder(data)
    if (data) {
      setEditForm({
        cleaner_id: data.cleaner_id || '',
        price: data.price,
        planned_date: data.planned_date || '',
        planned_time: data.planned_time || '',
      })
      setSelectedStatus(data.status)
    }
  }

  async function fetchCleaners() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'cleaner')

    setCleaners(data || [])
  }

  const handleSaveEdit = async () => {
    await supabase
      .from('orders')
      .update({
        cleaner_id: editForm.cleaner_id || null,
        price: editForm.price,
        planned_date: editForm.planned_date || null,
        planned_time: editForm.planned_time || null,
      })
      .eq('id', id)
    
    // Отправляем push-уведомление клинеру при назначении
    if (editForm.cleaner_id && editForm.cleaner_id !== order?.cleaner_id) {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editForm.cleaner_id,
          title: notificationsT('orderAssigned'),
          body: `${order?.client_name} - ${editForm.price} zł`,
          url: `/dashboard/cleaner/orders/${id}`,
          orderId: id
        })
      })
    }
    
    setIsEditing(false)
    fetchOrder()
  }

  // Функция для изменения статуса из выпадающего списка
  const updateStatus = async (newStatus: string) => {
    if (newStatus === selectedStatus) return
    
    setUpdatingStatus(true)
    
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
    
    // Отправляем push-уведомление клинеру
    if (order?.cleaner_id) {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: order.cleaner_id,
          title: notificationsT('statusChanged'),
          body: `Заказ "${order.client_name}" - ${statusLabels[newStatus]}`,
          url: `/dashboard/cleaner/orders/${id}`,
          orderId: id
        })
      })
    }
    
    setSelectedStatus(newStatus)
    setUpdatingStatus(false)
    fetchOrder()
  }

  // ЕДИНАЯ ФУНКЦИЯ РАСЧЁТА ОСТАВШЕГОСЯ ВРЕМЕНИ (синхронизирована с клинером)
  const calculateRemainingSeconds = (startTime: string, durationMinutes: number): number => {
    const startDate = new Date(startTime)
    const endTimeMs = startDate.getTime() + (durationMinutes * 60 * 1000)
    const nowMs = Date.now()
    return Math.max(0, Math.ceil((endTimeMs - nowMs) / 1000))
  }

  // Запуск таймера для активного заказа (синхронизирован с клинером)
  const startTimer = () => {
    if (!order?.start_time || !order?.duration) return

    // Очищаем предыдущий интервал
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    const updateTimer = () => {
      const remaining = calculateRemainingSeconds(order.start_time!, order.duration!)
      
      setRemainingSeconds(remaining)

      // Если время вышло, останавливаем таймер и обновляем заказ
      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }
        // Обновляем заказ, чтобы получить актуальные данные (возможно, статус изменился)
        fetchOrder()
      }
    }

    updateTimer() // Немедленное обновление
    timerIntervalRef.current = setInterval(updateTimer, 1000)
  }

  // Форматирование секунд в ЧЧ:ММ:СС (единый формат для всех)
  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes && minutes !== 0) return ''
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainder = minutes % 60
      if (remainder === 0) return `${hours} ${t('hours')}`
      return `${hours}ч ${remainder}мин`
    }
    return `${minutes} ${t('minutes')}`
  }

  // Прогресс в процентах (единый расчёт)
  const getProgressPercent = () => {
    if (!order?.start_time || !order?.duration || remainingSeconds === null) return 0
    
    const totalSeconds = order.duration * 60
    const elapsed = totalSeconds - remainingSeconds
    return Math.min(100, Math.max(0, Math.round((elapsed / totalSeconds) * 100)))
  }

  if (!order) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    </div>
  )

  const isInProgress = order.status === 'in_progress'
  const progressPercent = getProgressPercent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header с навигацией */}
        <div className="mb-8">
          <Link 
            href="/dashboard/admin/orders"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>{ordersT('backToOrders')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">#</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {ordersT('title')} {id.slice(0, 8).toUpperCase()}
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 ml-13">
                {ordersT('client')}: <span className="font-medium text-gray-700 dark:text-gray-300">{order.client_name}</span>
              </p>
            </div>
            
            {/* Выпадающий список для изменения статуса */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updatingStatus}
                className={`appearance-none px-5 py-2.5 pr-10 rounded-xl text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer ${statusColors[selectedStatus]} border-transparent`}
              >
                {allStatuses.map((status) => (
                  <option key={status.value} value={status.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Таймер - показываем только для заказов в процессе */}
        {isInProgress && remainingSeconds !== null && remainingSeconds > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                  <Timer size={28} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Уборка в процессе</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Осталось времени</p>
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl md:text-5xl font-bold text-amber-700 dark:text-amber-300">
                  {formatSeconds(remainingSeconds)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Плановая длительность: <span className="font-medium">{formatDuration(order.duration)}</span>
                </p>
              </div>
            </div>
            {/* Прогресс-бар */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Выполнено {progressPercent}%
              </p>
            </div>
          </div>
        )}

        {/* Если таймер закончился, показываем сообщение */}
        {isInProgress && remainingSeconds !== null && remainingSeconds === 0 && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                  <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Уборка завершена</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Время вышло</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Основная информация */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Данные клиента */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <User size={20} className="text-emerald-500" />
                {ordersT('client')}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Phone size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{ordersT('phone')}</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{order.client_phone || t('noName')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                  <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{ordersT('address')}</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{order.address}</p>
                  {order.google_maps_link && (
                    <a 
                      href={order.google_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm mt-2 transition-colors"
                    >
                      <ExternalLink size={14} /> {t('openInMaps')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Детали заказа */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-500" />
                {ordersT('details')}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">{ordersT('price')}</span>
                <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
              </div>
              
              {order.planned_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">{ordersT('plannedDate')}</span>
                  <span className="font-medium flex items-center gap-2">
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
              
              {/* Фактическое время уборки для завершённых заказов */}
              {order.status === 'done' && order.total_minutes && order.total_minutes > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Фактическое время</span>
                  <span className="font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle size={16} />
                    {formatDuration(order.total_minutes)}
                  </span>
                </div>
              )}
              
              {/* Длительность для запланированных заказов */}
              {order.duration && order.status !== 'done' && order.status !== 'in_progress' && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Плановая длительность</span>
                  <span className="font-medium flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    {formatDuration(order.duration)}
                  </span>
                </div>
              )}
              
              {/* Время начала уборки */}
              {order.start_time && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Время начала</span>
                  <span className="font-medium">
                    {new Date(order.start_time).toLocaleString('ru-RU')}
                  </span>
                </div>
              )}
              
              {/* Время окончания уборки */}
              {order.end_time && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Время окончания</span>
                  <span className="font-medium">
                    {new Date(order.end_time).toLocaleString('ru-RU')}
                  </span>
                </div>
              )}

              {order.comment && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                  <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">{ordersT('comment')}</p>
                  <p className="italic text-gray-700 dark:text-gray-300">{order.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Редактирование и чат */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Редактирование заказа */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 flex justify-between items-center">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Edit3 size={20} className="text-amber-500" />
                {settingsT('edit')}
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors"
                >
                  {t('edit')}
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {ordersT('cleaner')}
                    </label>
                    <select
                      value={editForm.cleaner_id}
                      onChange={(e) => setEditForm({ ...editForm, cleaner_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="">{cleanersT('notAssigned')}</option>
                      {cleaners.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {ordersT('price')} (zł)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {ordersT('date')}
                      </label>
                      <input 
                        type="date" 
                        value={editForm.planned_date} 
                        onChange={(e) => setEditForm({ ...editForm, planned_date: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {ordersT('time')}
                      </label>
                      <input 
                        type="time" 
                        value={editForm.planned_time} 
                        onChange={(e) => setEditForm({ ...editForm, planned_time: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      {t('save')}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          cleaner_id: order.cleaner_id || '',
                          price: order.price,
                          planned_date: order.planned_date || '',
                          planned_time: order.planned_time || '',
                        })
                      }}
                      className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{ordersT('cleaner')}</span>
                    <span className="font-medium">
                      {order.profiles?.full_name || <span className="text-gray-400">{cleanersT('notAssigned')}</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{ordersT('price')}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
                  </div>
                  {order.planned_date && (
                    <div className="flex justify-between py-3">
                      <span className="text-gray-500 dark:text-gray-400">{ordersT('plannedDate')}</span>
                      <span>
                        {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                        {order.planned_time && ` ${ordersT('timeAt')} ${order.planned_time.slice(0, 5)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Чат */}
          <OrderChat orderId={id} isAdmin={true} />
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2026 CRM Cleaning Company • {ordersT('details')} #{id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}