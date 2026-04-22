// src/app/dashboard/cleaner/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
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
  MessageSquare,
  CheckCircle,
  Clock as ClockIcon,
  Sparkles,
  AlertCircle,
  Wallet,
  Landmark,
  Coins,
  X
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
}

const statusLabels: Record<string, string> = {
  new: 'Новый',
  accepted: 'Принят',
  in_progress: 'В работе',
  done: 'Завершён',
  cancelled: 'Отменён',
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

export default function CleanerOrderDetail() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentType, setPaymentType] = useState<'cash' | 'bank'>('cash')
  const [clientGiven, setClientGiven] = useState(0)

  const supabase = createClient()

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
        .eq('cleaner_id', user.id)
        .single()

      if (error || !data) {
        setError('Заказ не найден или у вас нет доступа')
      } else {
        setOrder(data)
        setClientGiven(data.price)
      }
    } catch (err) {
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    setUpdating(true)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
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
      alert('Ошибка при приёме оплаты: ' + error.message)
    } else {
      alert('Оплата успешно принята! Заказ завершён.')
      setShowPaymentForm(false)
      fetchOrder()
    }
  }

  const getNextAction = () => {
    switch (order?.status) {
      case 'new':
        return { label: 'Принять заказ', status: 'accepted', color: 'emerald', icon: CheckCircle }
      case 'accepted':
        return { label: 'Начать уборку', status: 'in_progress', color: 'amber', icon: ClockIcon }
      case 'in_progress':
        return { label: 'Завершить уборку и принять оплату', status: 'done', color: 'green', icon: Sparkles, action: () => setShowPaymentForm(true) }
      default:
        return null
    }
  }

  const nextAction = getNextAction()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Загрузка заказа...</p>
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
          <p className="text-red-500 mb-6 text-lg">{error || 'Заказ не найден'}</p>
          <button
            onClick={() => router.push('/dashboard/cleaner')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition-all duration-200"
          >
            Вернуться к моим заказам
          </button>
        </div>
      </div>
    )
  }

  const change = Math.max(0, clientGiven - order.price)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with back button */}
      <div className="mb-8">
        <Link 
          href="/dashboard/cleaner"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Назад к заказам</span>
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">#</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Заказ {order.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-13">
              Клиент: <span className="font-medium text-gray-700 dark:text-gray-300">{order.client_name}</span>
            </p>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${statusColors[order.status]}`}>
            <span>{statusIcons[order.status]}</span>
            <span>{statusLabels[order.status]}</span>
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Client Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <User size={20} className="text-emerald-500" />
              Данные клиента
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Телефон</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.client_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Адрес</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{order.address}</p>
                {order.google_maps_link && (
                  <a 
                    href={order.google_maps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm mt-2 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Открыть в Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" />
              Детали заказа
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Сумма</span>
              <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
            </div>
            {order.planned_date && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Дата и время</span>
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
            {order.comment && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Комментарий</p>
                <p className="italic text-gray-700 dark:text-gray-300">{order.comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Action Button */}
      {nextAction && !showPaymentForm && (
        <div className="mb-8">
          <button
            onClick={nextAction.action || (() => updateStatus(nextAction.status))}
            disabled={updating}
            className={`w-full py-4 bg-gradient-to-r from-${nextAction.color}-600 to-${nextAction.color}-500 hover:from-${nextAction.color}-700 hover:to-${nextAction.color}-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 text-lg`}
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Обновление...</span>
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

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wallet size={22} className="text-emerald-500" />
                Приём оплаты
              </h2>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Total */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Сумма заказа</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{order.price} zł</p>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Способ оплаты
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
                    Наличные
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
                    На счёт
                  </button>
                </div>
              </div>

              {/* Cash Payment Fields */}
              {paymentType === 'cash' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Сколько дал клиент
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
                      <span className="text-gray-600 dark:text-gray-400">Сдача:</span>
                      <span className={`font-bold text-xl ${change > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {change.toFixed(2)} zł
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Payment Info */}
              {paymentType === 'bank' && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5 text-center">
                  <Landmark size={32} className="text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-700 dark:text-blue-300 font-medium">
                    Полная сумма {order.price} zł
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    будет зачислена на счёт фирмы
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAcceptPayment}
                  className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Принять оплату
                </button>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" />
            Чат с администратором
          </h2>
        </div>
        <div className="h-[450px]">
          <OrderChat orderId={id} isAdmin={false} />
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>© 2024 Управление клинингом • Заказ #{order.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  )
}