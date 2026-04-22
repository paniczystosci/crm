// src/app/dashboard/admin/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import OrderChat from '@/components/OrderChat'
import { Calendar, MapPin, Phone, DollarSign, ExternalLink, User, Clock, MessageSquare, Edit3, ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'

type Order = any

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

export default function AdminOrderDetail() {
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [cleaners, setCleaners] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    cleaner_id: '',
    price: 0,
    planned_date: '',
    planned_time: '',
  })
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
    if (data) {
      setEditForm({
        cleaner_id: data.cleaner_id || '',
        price: data.price,
        planned_date: data.planned_date || '',
        planned_time: data.planned_time || '',
      })
    }
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
    setIsEditing(false)
    fetchOrder()
  }

  if (!order) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 border-t-transparent"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header с навигацией */}
        <div className="mb-8">
          <Link 
            href="/dashboard/admin/orders"
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mb-4 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Назад к заказам</span>
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">#</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Заказ {id.slice(0, 8).toUpperCase()}
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

        {/* Основная информация */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Данные клиента */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <User size={20} className="text-rose-500" />
                Данные клиента
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Phone size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Телефон</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{order.client_phone || 'Не указан'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                  <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Адрес</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{order.address}</p>
                  {order.google_maps_link && (
                    <a 
                      href={order.google_maps_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-sm mt-2 transition-colors"
                    >
                      <ExternalLink size={14} /> Открыть в Google Maps
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
                Детали заказа
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Сумма</span>
                <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
              </div>
              
              {order.planned_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Дата и время</span>
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

        {/* Редактирование и чат */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Редактирование заказа */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 flex justify-between items-center">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Edit3 size={20} className="text-amber-500" />
                Редактирование заказа
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                >
                  Редактировать
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Клинер
                    </label>
                    <select
                      value={editForm.cleaner_id}
                      onChange={(e) => setEditForm({ ...editForm, cleaner_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    >
                      <option value="">Не назначен</option>
                      {cleaners.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Цена (zł)
                    </label>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Дата
                      </label>
                      <input 
                        type="date" 
                        value={editForm.planned_date} 
                        onChange={(e) => setEditForm({ ...editForm, planned_date: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Время
                      </label>
                      <input 
                        type="time" 
                        value={editForm.planned_time} 
                        onChange={(e) => setEditForm({ ...editForm, planned_time: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Сохранить
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
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Клинер</span>
                    <span className="font-medium">
                      {order.profiles?.full_name || <span className="text-gray-400">Не назначен</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Цена</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{order.price} zł</span>
                  </div>
                  {order.planned_date && (
                    <div className="flex justify-between py-3">
                      <span className="text-gray-500 dark:text-gray-400">Дата и время</span>
                      <span>
                        {new Date(order.planned_date).toLocaleDateString('ru-RU')}
                        {order.planned_time && ` в ${order.planned_time.slice(0, 5)}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Чат */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500" />
                Чат с клинером
              </h2>
            </div>
            <div className="h-[500px]">
              <OrderChat orderId={id} isAdmin={true} />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>© 2026 Управление клинингом • Детали заказа #{id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}