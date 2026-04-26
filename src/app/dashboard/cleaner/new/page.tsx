// src/app/(dashboard)/cleaner/new/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Calendar, Clock, Loader2, User, Phone, MapPin, Link2, MessageSquare, DollarSign, ArrowLeft, CheckCircle, Timer } from 'lucide-react'
import Link from 'next/link'
import { TimeSlotGrid } from '@/components/TimeSlotGrid'

type FormData = {
  client_name: string
  client_phone: string
  address: string
  google_maps_link: string
  comment: string
  price: string
  planned_date: string
  planned_time: string
  duration: string
}

export default function NewOrderPage() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const chatT = useTranslations('chat')
  const errorsT = useTranslations('errors')
  const notificationsT = useTranslations('notifications')
  
  const [form, setForm] = useState<FormData>({
    client_name: '',
    client_phone: '',
    address: '',
    google_maps_link: '',
    comment: '',
    price: '',
    planned_date: '',
    planned_time: '',
    duration: '60',
  })

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (form.planned_date && form.duration) {
      loadAvailableTimes(form.planned_date, parseInt(form.duration))
    } else {
      setAvailableTimes([])
    }
  }, [form.planned_date, form.duration])

  function isTimeOverlap(
    newStart: string,
    newDuration: number,
    existingStart: string,
    existingDuration: number
  ): boolean {
    const [newHours, newMinutes] = newStart.split(':').map(Number)
    const newStartMinutes = newHours * 60 + newMinutes
    const newEndMinutes = newStartMinutes + newDuration

    const [existingHours, existingMinutes] = existingStart.split(':').map(Number)
    const existingStartMinutes = existingHours * 60 + existingMinutes
    const existingEndMinutes = existingStartMinutes + existingDuration

    return newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes
  }

  async function loadAvailableTimes(date: string, duration: number) {
    setLoading(true)
    
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('planned_time, duration, status')
      .eq('planned_date', date)
      .eq('cleaner_id', (await supabase.auth.getUser()).data.user?.id)
      .not('status', 'eq', 'cancelled')

    const allSlots: string[] = []
    
    for (let h = 8; h <= 19; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        
        let isAvailable = true
        for (const order of existingOrders || []) {
          const existingDuration = order.duration || 60
          if (isTimeOverlap(time, duration, order.planned_time, existingDuration)) {
            isAvailable = false
            break
          }
        }
        
        if (isAvailable) {
          allSlots.push(time)
        }
      }
    }

    setAvailableTimes(allSlots)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: conflictingOrders } = await supabase
      .from('orders')
      .select('planned_time, duration')
      .eq('planned_date', form.planned_date)
      .eq('cleaner_id', user?.id)
      .not('status', 'eq', 'cancelled')

    const duration = parseInt(form.duration)
    let hasConflict = false

    for (const order of conflictingOrders || []) {
      const existingDuration = order.duration || 60
      if (isTimeOverlap(form.planned_time, duration, order.planned_time, existingDuration)) {
        hasConflict = true
        break
      }
    }

    if (hasConflict) {
      alert(ordersT('timeConflict'))
      setSubmitting(false)
      loadAvailableTimes(form.planned_date, duration)
      return
    }

    const { data, error } = await supabase.from('orders').insert({
      client_name: form.client_name,
      client_phone: form.client_phone,
      address: form.address,
      google_maps_link: form.google_maps_link || null,
      comment: form.comment || null,
      price: parseFloat(form.price),
      planned_date: form.planned_date,
      planned_time: form.planned_time,
      duration: duration,
      cleaner_id: user?.id,
      status: 'new',
      salary_type: 'manual',
      salary_value: null,
    }).select()

    if (error) {
      alert(`${errorsT('serverError')}: ${error.message}`)
    } else {
      const orderId = data?.[0]?.id
      
      if (orderId) {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
        
        if (admins && admins.length > 0) {
          for (const admin of admins) {
            try {
              await fetch('/api/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: admin.id,
                  title: notificationsT('newOrder'),
                  body: `${form.client_name} - ${form.price} zł`,
                  url: `/dashboard/admin/orders/${orderId}`,
                  orderId: orderId
                })
              })
            } catch (err) {
              console.error('Failed to send push notification:', err)
            }
          }
        }
      }
      
      router.push('/dashboard/cleaner')
      router.refresh()
    }

    setSubmitting(false)
  }

  const handleInputChange = useCallback((name: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }, [])

  const durationOptions = [
    { value: '30', label: ordersT('durationOptions.30') },
    { value: '60', label: ordersT('durationOptions.60') },
    { value: '90', label: ordersT('durationOptions.90') },
    { value: '120', label: ordersT('durationOptions.120') },
    { value: '180', label: ordersT('durationOptions.180') },
    { value: '240', label: ordersT('durationOptions.240') },
  ]

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard/cleaner"
          className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{ordersT('backToOrders')}</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {ordersT('new')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {ordersT('create')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Информация о клиенте */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <User size={18} className="text-emerald-500" />
            {ordersT('client')}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={form.client_name}
                onChange={(e) => handleInputChange('client_name', e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
                placeholder={ordersT('client')}
              />
            </div>
            
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={18} />
              </div>
              <input
                type="tel"
                required
                value={form.client_phone}
                onChange={(e) => handleInputChange('client_phone', e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
                placeholder={ordersT('phone')}
              />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin size={18} />
            </div>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
              placeholder={ordersT('address')}
            />
          </div>
          
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Link2 size={18} />
            </div>
            <input
              type="url"
              value={form.google_maps_link}
              onChange={(e) => handleInputChange('google_maps_link', e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
              placeholder={t('googleMaps')}
            />
          </div>
        </div>

        {/* Детали заказа */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Calendar size={18} className="text-emerald-500" />
            {ordersT('details')}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Дата */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                required
                value={form.planned_date}
                onChange={(e) => setForm({ ...form, planned_date: e.target.value })}
                className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            {/* Длительность уборки */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Timer size={18} />
              </div>
              <select
                required
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all duration-200"
              >
                {durationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Время начала */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Clock size={18} />
              </div>
              {!loading && availableTimes.length > 0 && (
                <TimeSlotGrid
                  availableTimes={availableTimes}
                  selectedTime={form.planned_time}
                  onSelectTime={(time) => setForm({ ...form, planned_time: time })}
                  loading={loading}
                />
              )}
              {availableTimes.length === 0 && !loading && form.planned_date && (
                <div className="mt-2 p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('noAvailableSlots')}
                  </p>
                </div>
              )}
              {loading && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  {t('loadingSlots')}
                </p>
              )}
            </div>
          </div>

          {/* Цена */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign size={18} />
            </div>
            <input
              type="number"
              required
              step="0.01"
              min="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200"
              placeholder={`${ordersT('price')} (zł)`}
            />
          </div>

          {/* Комментарий */}
          <div className="relative">
            <div className="absolute left-4 top-4 text-gray-400">
              <MessageSquare size={18} />
            </div>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all duration-200 resize-none"
              placeholder={`${ordersT('comment')} (${t('optional')})...`}
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>{ordersT('create')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}