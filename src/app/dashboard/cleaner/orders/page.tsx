// src/app/dashboard/cleaner/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import OrderChat from '@/components/OrderChat'

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
}

export default function CleanerOrderDetail() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    setLoading(true)
    setError(null)

    try {
      // Проверка авторизации
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Пользователь не авторизован:', authError)
        router.push('/auth/login')
        return
      }

      // Загрузка заказа с проверкой, что это заказ текущего клинера
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('cleaner_id', user.id)   // Важная защита!
        .single()

      if (error || !data) {
        console.error('Ошибка загрузки заказа:', error)
        setError('Заказ не найден или у вас нет доступа к нему')
        setOrder(null)
      } else {
        setOrder(data)
      }
    } catch (err) {
      console.error('Неожиданная ошибка при загрузке заказа:', err)
      setError('Произошла ошибка при загрузке данных')
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

    if (error) {
      console.error('Ошибка обновления статуса:', error)
      alert('Не удалось обновить статус заказа')
    } else {
      fetchOrder() // перезагружаем данные
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-lg">Загрузка заказа...</div>
  }

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

      {/* Информация о заказе */}
      <div className="card p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-lg mb-4">Данные клиента</h2>
          <div className="space-y-3">
            <p><strong>Имя:</strong> {order.client_name}</p>
            <p><strong>Телефон:</strong> {order.client_phone}</p>
            <p><strong>Адрес:</strong> {order.address}</p>
            {order.google_maps_link && (
              <a 
                href={order.google_maps_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-rose-600 hover:underline block"
              >
                Открыть в Google Maps →
              </a>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4">Детали заказа</h2>
          <div className="space-y-3">
            <p><strong>Цена:</strong> {order.price} zł</p>
            {order.planned_date && (
              <p>
                <strong>Дата и время:</strong>{' '}
                {new Date(order.planned_date).toLocaleDateString('ru-RU')} в{' '}
                {order.planned_time?.slice(0, 5)}
              </p>
            )}
            <p>
              <strong>Статус:</strong>{' '}
              <span className="capitalize font-medium ml-1">{order.status}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Управление статусом */}
      <div className="flex flex-wrap gap-4">
        {order.status === 'new' && (
          <button 
            onClick={() => updateStatus('accepted')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-medium transition"
          >
            Принять заказ
          </button>
        )}
        {order.status === 'accepted' && (
          <button 
            onClick={() => updateStatus('in_progress')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-medium transition"
          >
            Начать уборку
          </button>
        )}
        {order.status === 'in_progress' && (
          <button 
            onClick={() => updateStatus('done')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-medium transition"
          >
            Завершить уборку
          </button>
        )}
      </div>

      {/* Чат */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Чат с администратором</h2>
        <OrderChat orderId={id} isAdmin={false} />
      </div>
    </div>
  )
}