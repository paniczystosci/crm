// src/app/dashboard/cleaner/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import OrderChat from '@/components/OrderChat'
import { Calendar, MapPin, Phone, DollarSign, ExternalLink } from 'lucide-react'

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

export default function CleanerOrderDetail() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Форма приёма оплаты
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
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
    if (!error) fetchOrder()
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

  if (loading) return <div className="text-center py-12 text-lg">Загрузка заказа...</div>
  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-red-500 mb-6 text-lg">{error || 'Заказ не найден'}</p>
        <button
          onClick={() => router.push('/dashboard/cleaner')}
          className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-medium"
        >
          Вернуться к моим заказам
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Заказ #{id.slice(0, 8).toUpperCase()}</h1>
        <p className="text-zinc-500">Клиент: {order.client_name}</p>
      </div>

      {/* === ПОЛНАЯ ИНФОРМАЦИЯ О ЗАКАЗЕ === */}
      <div className="card p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-lg mb-4">Данные клиента</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Телефон</p>
                <p className="font-medium">{order.client_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-zinc-400 mt-0.5" />
              <div>
                <p className="text-sm text-zinc-500">Адрес</p>
                <p className="font-medium">{order.address}</p>
                {order.google_maps_link && (
                  <a
                    href={order.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-rose-600 hover:underline text-sm mt-2"
                  >
                    <ExternalLink size={16} /> Открыть в Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4">Детали заказа</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-zinc-500">Цена заказа</span>
              <span className="font-semibold text-xl">{order.price} zł</span>
            </div>
            {order.planned_date && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Дата и время</span>
                <span className="font-medium">
                  {new Date(order.planned_date).toLocaleDateString('ru-RU')} в {order.planned_time?.slice(0, 5)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Статус</span>
              <span className="capitalize font-medium">{order.status}</span>
            </div>

            {order.comment && (
              <div>
                <p className="text-sm text-zinc-500 mb-1">Комментарий клиента</p>
                <p className="text-zinc-700 dark:text-zinc-300 italic border-l-4 border-rose-300 pl-3">
                  {order.comment}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Управление статусом + форма оплаты */}
      <div className="flex flex-wrap gap-4">
        {order.status === 'new' && (
          <button onClick={() => updateStatus('accepted')} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl">
            Принять заказ
          </button>
        )}
        {order.status === 'accepted' && (
          <button onClick={() => updateStatus('in_progress')} className="bg-amber-600 text-white px-8 py-4 rounded-2xl">
            Начать уборку
          </button>
        )}
        {order.status === 'in_progress' && !showPaymentForm && (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-medium"
          >
            Завершить уборку + принять оплату
          </button>
        )}
      </div>

      {/* Форма приёма оплаты */}
      {showPaymentForm && (
        <div className="card p-8">
          <h2 className="text-2xl font-semibold mb-6">Приём оплаты от клиента</h2>
          {/* ... вся форма оплаты (остаётся без изменений) ... */}
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <div className="text-sm text-zinc-500">Сумма заказа</div>
              <div className="text-3xl font-bold text-emerald-600">{order.price} zł</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Способ оплаты</label>
              <div className="flex gap-3">
                <button onClick={() => setPaymentType('cash')} className={`flex-1 py-4 rounded-2xl font-medium ${paymentType === 'cash' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>💵 Наличные</button>
                <button onClick={() => setPaymentType('bank')} className={`flex-1 py-4 rounded-2xl font-medium ${paymentType === 'bank' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>🏦 На счёт фирмы</button>
              </div>
            </div>

            {paymentType === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Сколько дал клиент</label>
                  <input type="number" step="0.01" value={clientGiven} onChange={e => setClientGiven(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-2xl border text-2xl font-semibold" />
                </div>
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-2xl flex justify-between text-lg">
                  <span className="text-amber-700">Сдача:</span>
                  <span className="font-bold">{Math.max(0, clientGiven - order.price).toFixed(2)} zł</span>
                </div>
              </div>
            )}

            {paymentType === 'bank' && (
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-2xl text-center">
                <p className="text-blue-700 font-medium">Полная сумма {order.price} zł будет зачислена на счёт фирмы</p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button onClick={handleAcceptPayment} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl text-lg font-semibold">✅ Принять оплату и завершить заказ</button>
              <button onClick={() => setShowPaymentForm(false)} className="flex-1 py-5 border rounded-2xl text-lg">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Чат */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Чат с администратором</h2>
        <OrderChat orderId={id} isAdmin={false} />
      </div>
    </div>
  )
}