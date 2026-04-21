// src/app/dashboard/admin/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import OrderChat from '@/components/OrderChat'
import { Calendar, MapPin, Phone, DollarSign, ExternalLink } from 'lucide-react'

type Order = any

export default function AdminOrderDetail() {
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [cleaners, setCleaners] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchOrder()
    fetchCleaners()
  }, [id])

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
  }

  async function fetchCleaners() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'cleaner')

    setCleaners(data || [])
  }

  const updateOrder = async (field: string, value: any) => {
    await supabase
      .from('orders')
      .update({ [field]: value })
      .eq('id', id)
    fetchOrder()
  }

  if (!order) return <div className="text-center py-12">Загрузка...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Заказ #{id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-zinc-500 mt-1">Клиент: {order.client_name}</p>
        </div>
        <div className="px-6 py-2 rounded-2xl text-sm font-medium bg-emerald-100 text-emerald-700">
          {order.status}
        </div>
      </div>

      {/* === ПОЛНАЯ ИНФОРМАЦИЯ О ЗАКАЗЕ === */}
      <div className="card p-8 grid lg:grid-cols-2 gap-8">
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
                  <a href={order.google_maps_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-rose-600 hover:underline text-sm mt-2">
                    <ExternalLink size={16} /> Google Maps
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
              <span className="text-zinc-500">Цена</span>
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
            {order.comment && (
              <div>
                <p className="text-sm text-zinc-500 mb-1">Комментарий</p>
                <p className="italic border-l-4 border-rose-300 pl-3">{order.comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Редактирование */}
        <div className="card p-8 space-y-8">
          <h2 className="text-2xl font-semibold">Редактирование заказа</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Клинер</label>
              <select
                value={order.cleaner_id || ''}
                onChange={(e) => updateOrder('cleaner_id', e.target.value || null)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Не назначен</option>
                {cleaners.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Цена (zł)</label>
              <input
                type="number"
                value={order.price}
                onChange={(e) => updateOrder('price', parseFloat(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Дата</label>
                <input type="date" value={order.planned_date || ''} onChange={(e) => updateOrder('planned_date', e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
              </div>
              <div>
                <label className="block text-sm mb-2">Время</label>
                <input type="time" value={order.planned_time || ''} onChange={(e) => updateOrder('planned_time', e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Чат */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Чат с клинером</h2>
          <OrderChat orderId={id} isAdmin={true} />
        </div>
      </div>
    </div>
  )
}