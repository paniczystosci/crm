'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import OrderChat from '@/components/OrderChat'
import { 
  Calendar, 
  MapPin, 
  Phone, 
  DollarSign, 
  ExternalLink, 
  ArrowLeft, 
  Clock, 
  User,
  CheckCircle,
  Clock as ClockIcon,
  AlertCircle,
  Wallet,
  Landmark,
  Coins,
  X,
  Play,
  Pause,
  Square
} from 'lucide-react'
import Link from 'next/link'

type Order = {
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
  cleaner_id?: string | null
  start_time?: string | null
  end_time?: string | null
  total_minutes?: number | null
  duration?: string | null
}

export default function CleanerOrderDetail() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const paymentsT = useTranslations('payments')
  const errorsT = useTranslations('errors')
  
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentType, setPaymentType] = useState<'cash' | 'bank'>('cash')
  const [clientGiven, setClientGiven] = useState(0)

  // Трекер времени (обратный отсчёт)
  const [trackerRunning, setTrackerRunning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [initialDurationSeconds, setInitialDurationSeconds] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerStartTimeRef = useRef<Date | null>(null)
  const remainingAtPauseRef = useRef(0)

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

  // Эффект для трекера времени
  useEffect(() => {
    if (trackerRunning && timerStartTimeRef.current) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsedSinceStart = Math.floor((now.getTime() - timerStartTimeRef.current!.getTime()) / 1000)
        const remaining = Math.max(0, remainingAtPauseRef.current - elapsedSinceStart)
        setRemainingSeconds(remaining)
        
        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
          setTrackerRunning(false)
          handleStopTimerAutomatically()
        }
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [trackerRunning])

  // Автоматическое завершение
  const handleStopTimerAutomatically = async () => {
    if (!order) return
    
    const nowISO = new Date().toISOString()
    await supabase
      .from('orders')
      .update({ 
        end_time: nowISO, 
        total_minutes: Math.floor(initialDurationSeconds / 60),
        status: 'done'
      })
      .eq('id', id)
    
    fetchOrder()
    setShowPaymentForm(true)
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

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
        if (data.status === 'new' || data.cleaner_id === user.id) {
          setOrder(data)
          setClientGiven(data.price)
          
          // Рассчитываем длительность
          const durationMinutes = parseInt(data.duration || '60')
          const durationSeconds = durationMinutes * 60
          setInitialDurationSeconds(durationSeconds)
          
          if (data.status === 'in_progress' && data.start_time) {
            const start = new Date(data.start_time)
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
            const remaining = Math.max(0, durationSeconds - elapsed)
            
            setRemainingSeconds(remaining)
            remainingAtPauseRef.current = remaining
            timerStartTimeRef.current = now
            setTrackerRunning(true)
          } else if (data.status === 'done') {
            setRemainingSeconds(0)
            setTrackerRunning(false)
          } else {
            setRemainingSeconds(durationSeconds)
            remainingAtPauseRef.current = durationSeconds
            setTrackerRunning(false)
          }
          setIsInitialized(true)
        } else {
          setError(errorsT('accessDenied'))
        }
      }
    } catch (err) {
      setError(errorsT('loadError'))
    } finally {
      setLoading(false)
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

  const handleStartTimer = async () => {
    if (!order) return
    
    const now = new Date()
    const nowISO = now.toISOString()
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        start_time: nowISO, 
        status: 'in_progress' 
      })
      .eq('id', id)
    
    if (!error) {
      timerStartTimeRef.current = now
      remainingAtPauseRef.current = initialDurationSeconds
      setRemainingSeconds(initialDurationSeconds)
      setTrackerRunning(true)
      setOrder(prev => prev ? {...prev, status: 'in_progress', start_time: nowISO} : null)
    }
  }

  const handlePauseTimer = async () => {
    if (!trackerRunning) return
    
    const currentRemaining = remainingSeconds
    remainingAtPauseRef.current = currentRemaining
    setTrackerRunning(false)
    
    const elapsedSeconds = initialDurationSeconds - currentRemaining
    await supabase
      .from('orders')
      .update({ total_minutes: Math.floor(elapsedSeconds / 60) })
      .eq('id', id)
  }

  const handleResumeTimer = () => {
    if (trackerRunning) return
    timerStartTimeRef.current = new Date()
    setTrackerRunning(true)
  }

  const handleStopTimer = async () => {
    if (!order) return
    setTrackerRunning(false)
    
    const elapsedSeconds = initialDurationSeconds - remainingSeconds
    const totalMinutes = Math.max(1, Math.floor(elapsedSeconds / 60))
    const nowISO = new Date().toISOString()
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        end_time: nowISO, 
        total_minutes: totalMinutes,
        status: 'done'
      })
      .eq('id', id)
    
    if (!error) {
      setOrder(prev => prev ? {...prev, status: 'done', end_time: nowISO, total_minutes: totalMinutes} : null)
      setShowPaymentForm(true)
    }
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
          bgGradient: 'from-blue-600 to-blue-500',
          hoverGradient: 'from-blue-700 to-blue-600',
          icon: CheckCircle 
        }
      case 'accepted':
        return { 
          label: ordersT('start'), 
          status: 'in_progress', 
          bgGradient: 'from-yellow-500 to-amber-500',
          hoverGradient: 'from-yellow-600 to-amber-600',
          icon: ClockIcon 
        }
      default:
        return null
    }
  }

  const nextAction = getNextAction()

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercent = () => {
    if (initialDurationSeconds === 0) return 0
    const elapsed = initialDurationSeconds - remainingSeconds
    return (elapsed / initialDurationSeconds) * 100
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-red-500 mb-6 text-lg">{error || errorsT('notFound')}</p>
          <button
            onClick={() => router.push('/dashboard/cleaner')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200"
          >
            {ordersT('backToOrders')}
          </button>
        </div>
      </div>
    )
  }

  const change = Math.max(0, clientGiven - order.price)
  const isInProgress = order.status === 'in_progress'
  const hasStarted = order.start_time !== null && order.end_time === null
  const progressPercent = getProgressPercent()

  return (
    <div className="max-w-5xl mx-auto">
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
                <span className="text-white font-bold text-lg">#</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                {ordersT('title')} {order.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-13">
              {ordersT('client')}: <span className="font-medium text-gray-700 dark:text-gray-300">{order.client_name}</span>
            </p>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${statusColors[order.status]}`}>
            <span>{statusIcons[order.status]}</span>
            <span>{statusLabels[order.status]}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <User size={20} className="text-emerald-500" />
              {ordersT('client')}
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{ordersT('phone')}</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.client_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{ordersT('address')}</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.address}</p>
                {order.google_maps_link && (
                  <a 
                    href={order.google_maps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm mt-2 transition-colors"
                  >
                    <ExternalLink size={14} />
                    {t('openInMaps')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" />
              {ordersT('details')}
            </h2>
          </div>
          <div className="p-5 space-y-4">
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
            {order.duration && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{ordersT('duration')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {order.duration} {t('minutes')}
                </span>
              </div>
            )}
            {order.total_minutes && order.total_minutes > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{ordersT('cleaningTime')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.floor(order.total_minutes / 60)}ч {(order.total_minutes % 60)}мин
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

      {isInProgress && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ClockIcon size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('timer')}</p>
                <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                  {formatTime(remainingSeconds)}
                </p>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            <div className="flex justify-center gap-3">
              {!hasStarted ? (
                <button
                  onClick={handleStartTimer}
                  className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md"
                >
                  <Play size={18} />
                  {t('startCleaning')}
                </button>
              ) : (
                <>
                  {trackerRunning ? (
                    <button
                      onClick={handlePauseTimer}
                      className="flex items-center gap-2 px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md"
                    >
                      <Pause size={18} />
                      {t('pause')}
                    </button>
                  ) : (
                    <button
                      onClick={handleResumeTimer}
                      className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md"
                    >
                      <Play size={18} />
                      {t('resume')}
                    </button>
                  )}
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md"
                  >
                    <Square size={18} />
                    {t('complete')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {nextAction && !showPaymentForm && (
        <div className="mb-8">
          <button
            onClick={() => updateStatus(nextAction.status)}
            disabled={updating}
            className={`w-full py-4 bg-gradient-to-r ${nextAction.bgGradient} hover:${nextAction.hoverGradient} disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-lg`}
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <nextAction.icon size={20} />
                <span>{nextAction.label}</span>
              </>
            )}
          </button>
        </div>
      )}

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
                {order.total_minutes && order.total_minutes > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {ordersT('cleaningTime')}: {Math.floor(order.total_minutes / 60)}ч {(order.total_minutes % 60)}мин
                  </p>
                )}
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
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
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
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Landmark size={18} />
                    {t('bank')}
                  </button>
                </div>
              </div>

              {paymentType === 'cash' && (
                <div className="space-y-4">
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
                      />
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${change > 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">{t('change')}:</span>
                      <span className={`font-bold text-xl ${change > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {change.toFixed(2)} zł
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentType === 'bank' && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5 text-center">
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
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
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

      <div className="mt-8">
        <OrderChat orderId={id} isAdmin={false} />
      </div>

      <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>© 2026 CRM Cleaning Company • {ordersT('title')} #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  )
}